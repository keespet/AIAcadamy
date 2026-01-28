import { redirect } from 'next/navigation'
import { isCurrentUserAdmin } from '@/lib/admin'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAdmin = await isCurrentUserAdmin()

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div>
      <div className="border-b mb-6" style={{ borderColor: 'var(--border)' }}>
        <nav className="flex gap-6">
          <Link
            href="/admin"
            className="py-3 text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--foreground)' }}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/participants"
            className="py-3 text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--foreground)' }}
          >
            Deelnemers
          </Link>
          <Link
            href="/admin/invite"
            className="py-3 text-sm font-medium hover:opacity-80"
            style={{ color: 'var(--foreground)' }}
          >
            Uitnodigen
          </Link>
        </nav>
      </div>
      {children}
    </div>
  )
}
