import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin'

interface UserRecord {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'participant'
  status: 'active' | 'inactive' | 'pending'
  created_at: string
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

  const supabase = createAdminClient()

  // Get all participants from users table (consistent with admin dashboard)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at')
    .eq('role', 'participant')
    .order('created_at', { ascending: false }) as { data: UserRecord[] | null, error: Error | null }

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  // Get module count
  const { count: totalModules } = await supabase
    .from('modules')
    .select('id', { count: 'exact', head: true })

  // Get progress for all users
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('user_id, quiz_completed, quiz_score, completed_at') as { data: UserProgress[] | null }

  // Get certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('user_id') as { data: Certificate[] | null }

  const participantsWithProgress = users?.map(user => {
    const userProgress = allProgress?.filter(p => p.user_id === user.id) || []
    const completedModules = userProgress.filter(p => p.quiz_completed && (p.quiz_score ?? 0) >= 70).length
    const hasCertificate = certificates?.some(c => c.user_id === user.id) || false
    const lastActivity = userProgress
      .map(p => p.completed_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null

    return {
      id: user.id,  // Use the user's UUID as ID
      odometer: user.id,
      userId: user.id,
      email: user.email,
      fullName: user.full_name || user.email,
      role: user.role,
      status: user.status,
      invitedAt: user.created_at,
      joinedAt: user.created_at,
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

  if (!['active', 'inactive', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Update status in users table (memberId is now the user's UUID)
  const { error } = await supabase
    .from('users')
    .update({ status } as never)
    .eq('id', memberId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
