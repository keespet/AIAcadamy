import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import QuizContent from './QuizContent'
import { Module, Question, UserProgress } from '@/types/database'

// Force dynamic rendering - progress data should always be fresh
export const dynamic = 'force-dynamic'

interface QuizPageProps {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params
  const moduleId = parseInt(id)

  if (isNaN(moduleId)) {
    notFound()
  }

  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  // Fetch the module
  const { data: moduleData } = await supabase
    .from('modules')
    .select('id, order_number, title, description, gamma_embed_url, created_at')
    .eq('id', moduleId)
    .single()

  const courseModule = moduleData as Module | null

  if (!courseModule) {
    notFound()
  }

  // Get user progress for this module
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('id, user_id, module_id, view_time_seconds, quiz_score, quiz_completed, completed_at')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single()

  const progress = progressData as UserProgress | null

  // Fetch questions for this module
  const { data: questionsData } = await supabase
    .from('questions')
    .select('id, module_id, question_text, option_a, option_b, option_c, option_d, correct_answer, order_number')
    .eq('module_id', moduleId)
    .order('order_number')

  const questions = questionsData as Question[] | null

  if (!questions || questions.length === 0) {
    // No questions available, redirect back to module
    redirect(`/module/${moduleId}`)
  }

  return (
    <QuizContent
      module={courseModule}
      questions={questions}
      userId={user.id}
      previousBestScore={progress?.quiz_score}
    />
  )
}
