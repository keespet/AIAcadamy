import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createClient()

  const { data: member, error } = await supabase
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
    .eq('id', id)
    .single()

  if (error || !member) {
    return NextResponse.json({ error: 'Lid niet gevonden' }, { status: 404 })
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
    .eq('user_id', member.user_id)
    .order('module_id')

  // Get certificate
  const { data: certificate } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', member.user_id)
    .single()

  return NextResponse.json({
    member: {
      id: member.id,
      userId: member.user_id,
      fullName: (member.profiles as { full_name: string | null })?.full_name || 'Onbekend',
      role: member.role,
      status: member.status,
      invitedAt: member.invited_at,
      joinedAt: member.joined_at
    },
    progress: progress?.map(p => ({
      moduleId: p.module_id,
      moduleTitle: (p.modules as { title: string; order_number: number })?.title,
      moduleOrder: (p.modules as { title: string; order_number: number })?.order_number,
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
  const supabase = await createClient()

  // Check if trying to delete self
  const { data: member } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('id', id)
    .single()

  if (member?.user_id === admin.userId) {
    return NextResponse.json({ error: 'Je kunt jezelf niet verwijderen' }, { status: 400 })
  }

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
