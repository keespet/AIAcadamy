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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
      <OfflineIndicator />
    </div>
  )
}
