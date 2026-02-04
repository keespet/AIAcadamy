import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import ModuleContent from './ModuleContent'
import { Module, UserProgress } from '@/types/database'

// Force dynamic rendering - progress data should always be fresh
export const dynamic = 'force-dynamic'

interface ModulePageProps {
  params: Promise<{ id: string }>
}

export default async function ModulePage({ params }: ModulePageProps) {
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

  // Check if module is unlocked
  const { data: allModulesData } = await supabase
    .from('modules')
    .select('id, order_number, title')
    .order('order_number')

  const { data: allProgressData } = await supabase
    .from('user_progress')
    .select('module_id, quiz_score, quiz_completed')
    .eq('user_id', user.id)

  const allModules = allModulesData as Module[] | null
  const allProgress = allProgressData as UserProgress[] | null

  const progressMap = new Map(allProgress?.map(p => [p.module_id, p]) || [])

  // Find current module index
  const moduleIndex = allModules?.findIndex(m => m.id === moduleId) ?? -1
  let isUnlocked = moduleIndex === 0

  if (moduleIndex > 0 && allModules) {
    const prevModule = allModules[moduleIndex - 1]
    const prevProgress = progressMap.get(prevModule.id)
    isUnlocked = prevProgress?.quiz_completed && (prevProgress?.quiz_score ?? 0) >= 70 || false
  }

  if (!isUnlocked) {
    redirect('/dashboard')
  }

  // Get current progress for this module
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('id, user_id, module_id, view_time_seconds, quiz_score, quiz_completed, completed_at')
    .eq('user_id', user.id)
    .eq('module_id', moduleId)
    .single()

  const progress = progressData as UserProgress | null

  return (
    <ModuleContent
      module={courseModule}
      userId={user.id}
      initialProgress={progress}
    />
  )
}
