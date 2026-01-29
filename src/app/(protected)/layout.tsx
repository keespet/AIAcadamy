import { getCurrentUser } from '@/lib/auth'
import Navigation from '@/components/Navigation'
import OfflineIndicator from '@/components/OfflineIndicator'
import { redirect } from 'next/navigation'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const userName = user.full_name || user.email
  const isAdmin = user.role === 'admin'

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navigation userName={userName} isAdmin={isAdmin} />
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16">
        {children}
      </main>
      <OfflineIndicator />
    </div>
  )
}
