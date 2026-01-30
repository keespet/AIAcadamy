import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

// Force dynamic rendering - don't cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface UserRecord {
  id: string
  full_name: string | null
  email: string
  role: 'admin' | 'participant'
  status: 'active' | 'inactive' | 'pending'
  created_at: string
}

interface UserProgress {
  user_id: string
  quiz_completed: boolean
  quiz_score: number | null
}

interface Certificate {
  user_id: string
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient()

  // Get all users (participants)
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email, role, status, created_at')
    .eq('role', 'participant') as { data: UserRecord[] | null }

  // Get module count
  const { count: totalModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })

  // Get all progress
  const { data: allProgress } = await supabase
    .from('user_progress')
    .select('user_id, quiz_completed, quiz_score') as { data: UserProgress[] | null }

  // Get certificates
  const { data: certificates } = await supabase
    .from('certificates')
    .select('user_id') as { data: Certificate[] | null }

  // Calculate statistics
  const participants = users || []
  const activeParticipants = participants.filter(u => u.status === 'active')
  const inactiveParticipants = participants.filter(u => u.status === 'inactive')
  const pendingParticipants = participants.filter(u => u.status === 'pending')

  // Calculate average progress
  let totalProgress = 0
  participants.forEach(user => {
    const userProgress = allProgress?.filter(p => p.user_id === user.id) || []
    const completed = userProgress.filter(p => p.quiz_completed && (p.quiz_score ?? 0) >= 70).length
    totalProgress += totalModules ? (completed / totalModules) * 100 : 0
  })
  const averageProgress = participants.length > 0 ? Math.round(totalProgress / participants.length) : 0

  // Count certificates
  const certificateCount = certificates?.length || 0

  // Recent participants
  const recentParticipants = [...participants]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-sm mb-1" style={{ color: 'var(--secondary)' }}>Totaal deelnemers</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{participants.length}</p>
        </div>
        <div className="card">
          <p className="text-sm mb-1" style={{ color: 'var(--secondary)' }}>Actief</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>{activeParticipants.length}</p>
        </div>
        <div className="card">
          <p className="text-sm mb-1" style={{ color: 'var(--secondary)' }}>Gem. voortgang</p>
          <p className="text-3xl font-bold">{averageProgress}%</p>
        </div>
        <div className="card">
          <p className="text-sm mb-1" style={{ color: 'var(--secondary)' }}>Certificaten</p>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{certificateCount}</p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Status overzicht</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Actief</span>
              <span className="font-medium" style={{ color: 'var(--success)' }}>{activeParticipants.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Inactief</span>
              <span className="font-medium" style={{ color: 'var(--error)' }}>{inactiveParticipants.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>In afwachting</span>
              <span className="font-medium" style={{ color: 'var(--accent)' }}>{pendingParticipants.length}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Snelle acties</h2>
          <div className="space-y-3">
            <Link href="/admin/invite" className="btn-primary w-full">
              Nieuwe deelnemer toevoegen
            </Link>
            <Link href="/admin/participants" className="btn-secondary w-full">
              Alle deelnemers bekijken
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Participants */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Recente deelnemers</h2>
          <Link href="/admin/participants" className="text-sm" style={{ color: 'var(--primary)' }}>
            Bekijk alle
          </Link>
        </div>
        {recentParticipants.length > 0 ? (
          <div className="space-y-3">
            {recentParticipants.map(user => {
              const userProgress = allProgress?.filter(p => p.user_id === user.id) || []
              const completed = userProgress.filter(p => p.quiz_completed && (p.quiz_score ?? 0) >= 70).length
              const progress = totalModules ? Math.round((completed / totalModules) * 100) : 0

              return (
                <div key={user.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <p className="font-medium">{user.full_name || user.email}</p>
                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                      Gestart: {new Date(user.created_at).toLocaleDateString('nl-NL')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{progress}%</p>
                    <p className="text-sm" style={{ color: 'var(--secondary)' }}>
                      {completed}/{totalModules || 6} modules
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--secondary)' }}>Nog geen deelnemers</p>
        )}
      </div>
    </div>
  )
}
