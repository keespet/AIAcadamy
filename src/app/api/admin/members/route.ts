import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

interface OrganizationMemberWithProfile {
  id: number
  user_id: string
  role: string
  status: string
  invited_at: string
  joined_at: string | null
  profiles: { full_name: string | null }
}

interface UserProgress {
  user_id: string
  quiz_completed: boolean
  quiz_score: number | null
  completed_at: string | null
}

interface Certificate {
  user_id: string
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all organization members with their profiles and progress
  // Use profiles!user_id to explicitly specify which FK to use (avoids ambiguous relationship error)
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      status,
      invited_at,
      joined_at,
      profiles!user_id(full_name)
    `)
    .order('invited_at', { ascending: false }) as { data: OrganizationMemberWithProfile[] | null, error: Error | null }

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 })
  }

  // Get module count
  const { count: totalModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })

  // Get progress for all users
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('user_id, quiz_completed, quiz_score, completed_at') as { data: UserProgress[] | null }

  // Get certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('user_id') as { data: Certificate[] | null }

  const participantsWithProgress = members?.map(member => {
    const userProgress = allProgress?.filter(p => p.user_id === member.user_id) || []
    const completedModules = userProgress.filter(p => p.quiz_completed && (p.quiz_score ?? 0) >= 70).length
    const hasCertificate = certificates?.some(c => c.user_id === member.user_id) || false
    const lastActivity = userProgress
      .map(p => p.completed_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null

    return {
      id: member.id,
      userId: member.user_id,
      fullName: member.profiles?.full_name || 'Onbekend',
      role: member.role,
      status: member.status,
      invitedAt: member.invited_at,
      joinedAt: member.joined_at,
      totalModules: totalModules || 6,
      completedModules,
      progressPercentage: totalModules ? Math.round((completedModules / totalModules) * 100) : 0,
      hasCertificate,
      lastActivity
    }
  }) || []

  return NextResponse.json({ participants: participantsWithProgress })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { memberId, status } = body

  if (!memberId || !status) {
    return NextResponse.json({ error: 'Missing memberId or status' }, { status: 400 })
  }

  if (!['active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('organization_members')
    .update({ status } as never)
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
