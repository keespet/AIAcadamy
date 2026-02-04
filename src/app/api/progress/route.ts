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
    const { moduleId, viewTimeSeconds } = body

    if (typeof moduleId !== 'number' || typeof viewTimeSeconds !== 'number') {
      return NextResponse.json({ error: 'Ongeldige data' }, { status: 400 })
    }

    if (viewTimeSeconds < 0 || viewTimeSeconds > 86400) {
      return NextResponse.json({ error: 'Ongeldige tijd' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // First, get existing progress to preserve quiz data
    const { data: existingProgress } = await supabase
      .from('user_progress')
      .select('quiz_score, quiz_completed, completed_at')
      .eq('user_id', user.id)
      .eq('module_id', moduleId)
      .single()

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        view_time_seconds: viewTimeSeconds,
        // Preserve existing quiz data
        quiz_score: existingProgress?.quiz_score ?? null,
        quiz_completed: existingProgress?.quiz_completed ?? false,
        completed_at: existingProgress?.completed_at ?? null,
      } as never, {
        onConflict: 'user_id,module_id',
      })

    if (error) {
      console.error('Progress save error:', error)
      return NextResponse.json({ error: 'Fout bij opslaan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch {
    return NextResponse.json({ error: 'Ongeldige request' }, { status: 400 })
  }
}
