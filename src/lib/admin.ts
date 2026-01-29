import { getCurrentUser } from '@/lib/auth'

export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return user.role === 'admin'
}

export async function getCurrentUserRole(): Promise<'admin' | 'participant' | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return user.role
}

export async function requireAdmin(): Promise<{ userId: string } | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') return null
  return { userId: user.id }
}
