import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import Link from 'next/link'
import { Module, UserProgress } from '@/types/database'

type ModuleWithProgress = Module & {
  progress: UserProgress | null
  isUnlocked: boolean
  status: 'not_started' | 'in_progress' | 'completed'
}

async function getModulesWithProgress(userId: string): Promise<ModuleWithProgress[]> {
  const supabase = createAdminClient()

  const { data: modulesData } = await supabase
    .from('modules')
    .select('id, order_number, title, description, gamma_embed_url, created_at')
    .order('order_number')

  const { data: progressData } = await supabase
    .from('user_progress')
    .select('id, user_id, module_id, view_time_seconds, quiz_score, quiz_completed, completed_at')
    .eq('user_id', userId)

  const modules = modulesData as Module[] | null
  const progress = progressData as UserProgress[] | null

  if (!modules) return []

  const progressMap = new Map(progress?.map(p => [p.module_id, p]) || [])

  return modules.map((module, index) => {
    const moduleProgress = progressMap.get(module.id) || null

    // Module is completed if quiz is completed with >= 70%
    const isCompleted = moduleProgress?.quiz_completed && (moduleProgress?.quiz_score ?? 0) >= 70

    // Module is unlocked if:
    // - It's the first module
    // - Or the previous module is completed
    let isUnlocked = index === 0

    if (index > 0) {
      const prevModule = modules[index - 1]
      const prevProgress = progressMap.get(prevModule.id)
      isUnlocked = prevProgress?.quiz_completed && (prevProgress?.quiz_score ?? 0) >= 70 || false
    }

    // Determine status
    let status: 'not_started' | 'in_progress' | 'completed' = 'not_started'
    if (isCompleted) {
      status = 'completed'
    } else if (moduleProgress && (moduleProgress.view_time_seconds > 0 || moduleProgress.quiz_score !== null)) {
      status = 'in_progress'
    }

    return {
      ...module,
      progress: moduleProgress,
      isUnlocked,
      status,
    }
  })
}

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return null // Middleware will redirect
  }

  const modules = await getModulesWithProgress(user.id)
  const completedCount = modules.filter(m => m.status === 'completed').length
  const progressPercentage = (completedCount / modules.length) * 100

  const userName = user.full_name || 'daar'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welkom{userName ? `, ${userName.split(' ')[0]}` : ''}!
        </h1>
        <p style={{ color: 'var(--secondary)' }}>
          Voltooi alle modules om je AI Academy certificaat te ontvangen.
        </p>
      </div>

      {/* Progress overview */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium">Totale voortgang</span>
          <span className="font-semibold" style={{ color: 'var(--primary)' }}>
            {completedCount} van {modules.length} modules
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {completedCount === modules.length && (
          <div className="mt-4 p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
            <p className="font-semibold" style={{ color: 'var(--success)' }}>
              Gefeliciteerd! Je hebt alle modules voltooid.
            </p>
            <Link href="/certificate" className="btn-primary mt-3 inline-block">
              Bekijk je certificaat
            </Link>
          </div>
        )}
      </div>

      {/* Module grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </div>
  )
}

function ModuleCard({ module }: { module: ModuleWithProgress }) {
  const statusStyles = {
    not_started: '',
    in_progress: 'in-progress',
    completed: 'completed',
  }

  const statusLabels = {
    not_started: 'Niet gestart',
    in_progress: 'Bezig',
    completed: 'Voltooid',
  }

  const statusColors = {
    not_started: 'var(--secondary)',
    in_progress: 'var(--primary)',
    completed: 'var(--success)',
  }

  return (
    <div
      className={`card module-card ${statusStyles[module.status]} ${!module.isUnlocked ? 'locked' : ''}`}
    >
      {/* Module number */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-4 font-bold"
        style={{
          backgroundColor: module.status === 'completed' ? 'var(--success)' : 'var(--primary)',
          color: 'white',
        }}
      >
        {module.status === 'completed' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          module.order_number
        )}
      </div>

      <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--secondary)' }}>
        {module.description}
      </p>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColors[module.status] }}
        />
        <span className="text-sm" style={{ color: statusColors[module.status] }}>
          {statusLabels[module.status]}
        </span>
        {module.progress?.quiz_score !== null && module.progress?.quiz_score !== undefined && (
          <span className="text-sm ml-auto" style={{ color: 'var(--secondary)' }}>
            Score: {module.progress.quiz_score}%
          </span>
        )}
      </div>

      {/* Action button */}
      {module.isUnlocked ? (
        <Link
          href={`/module/${module.id}`}
          className="btn-primary w-full text-center"
        >
          {module.status === 'completed' ? 'Opnieuw bekijken' : module.status === 'in_progress' ? 'Doorgaan' : 'Start module'}
        </Link>
      ) : (
        <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Vergrendeld
        </button>
      )}
    </div>
  )
}
