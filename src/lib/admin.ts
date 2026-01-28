import { createClient } from '@/lib/supabase/server'

interface OrganizationMember {
  role: 'admin' | 'participant'
  status: 'active' | 'inactive' | 'pending'
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('user_id', user.id)
    .single() as { data: OrganizationMember | null }

  return data?.role === 'admin' && data?.status === 'active'
}

export async function getCurrentUserRole(): Promise<'admin' | 'participant' | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('user_id', user.id)
    .single() as { data: OrganizationMember | null }

  if (!data || data.status !== 'active') return null
  return data.role
}

export async function requireAdmin(): Promise<{ userId: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('user_id', user.id)
    .single() as { data: OrganizationMember | null }

  if (data?.role !== 'admin' || data?.status !== 'active') return null

  return { userId: user.id }
}
