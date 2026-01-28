import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import OfflineIndicator from '@/components/OfflineIndicator'

interface OrganizationMember {
  role: 'admin' | 'participant'
  status: 'active' | 'inactive' | 'pending'
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName: string | null = null
  let isAdmin = false

  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const profile = profileData as { full_name: string | null } | null
    userName = profile?.full_name || user.user_metadata?.full_name || user.email

    // Check if user is admin
    const { data: memberData } = await supabase
      .from('organization_members')
      .select('role, status')
      .eq('user_id', user.id)
      .single() as { data: OrganizationMember | null }

    isAdmin = memberData?.role === 'admin' && memberData?.status === 'active'
  }

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
