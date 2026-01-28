import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import QuizContent from './QuizContent'
import { Module, Question, UserProgress } from '@/types/database'

interface QuizPageProps {
  params: Promise<{ id: string }>
}

export default async function QuizPage({ params }: QuizPageProps) {
  const { id } = await params
  const moduleId = parseInt(id)

  if (isNaN(moduleId)) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the module
  const { data: moduleData } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single()

  const courseModule = moduleData as Module | null

  if (!courseModule) {
    notFound()
  }

  // Check if user has viewed the module for at least 2 minutes
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single()

  const progress = progressData as UserProgress | null

  if (!progress || progress.view_time_seconds < 120) {
    redirect(`/module/${moduleId}`)
  }

  // Fetch questions for this module
  const { data: questionsData } = await supabase
    .from('questions')
    .select('*')
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
