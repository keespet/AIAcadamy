import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import OfflineIndicator from '@/components/OfflineIndicator'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | null = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const profile = profileData as { full_name: string | null } | null
    userName = profile?.full_name || user.user_metadata?.full_name || user.email
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Navigation userName={userName} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {children}
      </main>
      <OfflineIndicator />
    </div>
  )
}
