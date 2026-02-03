import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { moduleId, quizScore } = body

    if (typeof moduleId !== 'number' || typeof quizScore !== 'number') {
      return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 })
    }

    if (quizScore < 0 || quizScore > 100) {
      return NextResponse.json({ error: 'Ongeldige score' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const isPassing = quizScore >= 70

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        quiz_score: quizScore,
        quiz_completed: isPassing,
        completed_at: isPassing ? new Date().toISOString() : null,
      } as never, {
        onConflict: 'user_id,module_id',
      })

    if (error) {
      console.error('Quiz save error:', error)
      return NextResponse.json({ error: 'Fout bij opslaan' }, { status: 500 })
    }

    return NextResponse.json({ success: true, isPassing })

  } catch {
    return NextResponse.json({ error: 'Ongeldige request' }, { status: 400 })
  }
}
