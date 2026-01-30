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

interface UserProgressWithModule {
  module_id: number
  view_time_seconds: number
  quiz_score: number | null
  quiz_completed: boolean
  completed_at: string | null
  modules: { title: string; order_number: number }
}

interface Certificate {
  verification_code: string
  average_score: number | null
  issued_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Get user from users table
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, status, created_at')
    .eq('id', id)
    .single() as { data: UserRecord | null, error: Error | null }

  if (error || !user) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
  }

  // Get user progress
  const { data: progress } = await supabase
    .from('user_progress')
    .select(`
      module_id,
      view_time_seconds,
      quiz_score,
      quiz_completed,
      completed_at,
      modules!inner(title, order_number)
    `)
    .eq('user_id', id)
    .order('module_id') as { data: UserProgressWithModule[] | null }

  // Get certificate
  const { data: certificate } = await supabase
    .from('certificates')
    .select('verification_code, average_score, issued_at')
    .eq('user_id', id)
    .single() as { data: Certificate | null }

  return NextResponse.json({
    member: {
      id: user.id,
      odometer: user.id,
      email: user.email,
      fullName: user.full_name || user.email,
      role: user.role,
      status: user.status,
      invitedAt: user.created_at,
      joinedAt: user.created_at
    },
    progress: progress?.map(p => ({
      moduleId: p.module_id,
      moduleTitle: p.modules?.title,
      moduleOrder: p.modules?.order_number,
      viewTimeSeconds: p.view_time_seconds,
      quizScore: p.quiz_score,
      quizCompleted: p.quiz_completed,
      completedAt: p.completed_at
    })) || [],
    certificate: certificate ? {
      verificationCode: certificate.verification_code,
      averageScore: certificate.average_score,
      issuedAt: certificate.issued_at
    } : null
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createAdminClient()

  // Check if trying to delete self
  if (id === admin.userId) {
    return NextResponse.json({ error: 'Je kunt jezelf niet verwijderen' }, { status: 400 })
  }

  // Check if user exists and is a participant (not admin)
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single() as { data: { role: string } | null }

  if (!user) {
    return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
  }

  if (user.role === 'admin') {
    return NextResponse.json({ error: 'Je kunt geen admin verwijderen' }, { status: 400 })
  }

  // Delete user (cascades to user_progress, certificates due to FK constraints)
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
