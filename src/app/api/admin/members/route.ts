import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get all organization members with their profiles and progress
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select(`
      id,
      user_id,
      role,
      status,
      invited_at,
      joined_at,
      profiles!inner(full_name)
    `)
    .order('invited_at', { ascending: false })

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
    .select('user_id, quiz_completed, quiz_score, completed_at')

  // Get certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('user_id')

  // Get emails from auth.users via a workaround - we'll need to use the admin API
  // For now, we'll return what we have and fetch emails separately if needed

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
      fullName: (member.profiles as { full_name: string | null })?.full_name || 'Onbekend',
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
    .update({ status })
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
