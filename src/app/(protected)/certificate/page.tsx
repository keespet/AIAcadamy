import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import CertificateContent from './CertificateContent'
import Link from 'next/link'
import { Module, UserProgress, Certificate } from '@/types/database'
import { v4 as uuidv4 } from 'uuid'

// Force dynamic rendering - user data should always be fresh
export const dynamic = 'force-dynamic'

export default async function CertificatePage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = createAdminClient()

  // Get all modules
  const { data: modulesData } = await supabase
    .from('modules')
    .select('id, order_number, title, description, gamma_embed_url, created_at')
    .order('order_number')

  // Get user progress for all modules
  const { data: progressData } = await supabase
    .from('user_progress')
    .select('id, user_id, module_id, view_time_seconds, quiz_score, quiz_completed, completed_at')
    .eq('user_id', user.id)

  const modules = modulesData as Module[] | null
  const progress = progressData as UserProgress[] | null

  if (!modules || !progress) {
    return (
      <div className="card text-center">
        <p>Er is een fout opgetreden. Probeer het later opnieuw.</p>
      </div>
    )
  }

  // Check if all modules are completed with >= 70%
  const progressMap = new Map(progress.map(p => [p.module_id, p]))
  const allCompleted = modules.every(module => {
    const moduleProgress = progressMap.get(module.id)
    return moduleProgress?.quiz_completed && (moduleProgress?.quiz_score ?? 0) >= 70
  })

  if (!allCompleted) {
    const completedCount = modules.filter(module => {
      const moduleProgress = progressMap.get(module.id)
      return moduleProgress?.quiz_completed && (moduleProgress?.quiz_score ?? 0) >= 70
    }).length

    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}>
            <svg className="w-10 h-10" style={{ color: 'var(--secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2">Certificaat nog niet beschikbaar</h1>
          <p className="mb-6" style={{ color: 'var(--secondary)' }}>
            Je moet alle 6 modules succesvol afronden (minimaal 70% per module) om je certificaat te ontvangen.
          </p>

          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
            <p className="font-medium mb-2">Huidige voortgang</p>
            <div className="progress-bar mb-2">
              <div
                className="progress-bar-fill"
                style={{ width: `${(completedCount / modules.length) * 100}%` }}
              />
            </div>
            <p className="text-sm" style={{ color: 'var(--secondary)' }}>
              {completedCount} van {modules.length} modules voltooid
            </p>
          </div>

          <Link href="/dashboard" className="btn-primary">
            Terug naar dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Calculate average score
  const scores = progress.map(p => p.quiz_score || 0)
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  // Get or create certificate
  const { data: certificateData } = await supabase
    .from('certificates')
    .select('id, user_id, verification_code, average_score, issued_at')
    .eq('user_id', user.id)
    .single()

  let certificate = certificateData as Certificate | null

  if (!certificate) {
    // Generate verification code using UUID
    const verificationCode = `AIA-${uuidv4().substring(0, 8).toUpperCase()}`

    const { data: newCertificate } = await supabase
      .from('certificates')
      .insert({
        user_id: user.id,
        verification_code: verificationCode,
        average_score: averageScore,
      } as never)
      .select()
      .single()

    certificate = newCertificate as Certificate | null
  }

  // Get user name
  const userName = user.full_name || 'Onbekend'

  return (
    <CertificateContent
      userName={userName}
      averageScore={averageScore}
      verificationCode={certificate?.verification_code || ''}
      issuedAt={certificate?.issued_at || new Date().toISOString()}
    />
  )
}
