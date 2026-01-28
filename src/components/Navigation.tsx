'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavigationProps {
  userName?: string | null
}

export default function Navigation({ userName }: NavigationProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="border-b" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
            AI Academy
          </Link>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="hover:opacity-80" style={{ color: 'var(--foreground)' }}>
              Dashboard
            </Link>
            <Link href="/certificate" className="hover:opacity-80" style={{ color: 'var(--foreground)' }}>
              Certificaat
            </Link>
            <Link href="/profile" className="hover:opacity-80" style={{ color: 'var(--foreground)' }}>
              Profiel
            </Link>
            <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: 'var(--border)' }}>
              <span className="text-sm" style={{ color: 'var(--secondary)' }}>
                {userName || 'Gebruiker'}
              </span>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="btn-secondary text-sm py-2 px-3"
              >
                {loading ? 'Uitloggen...' : 'Uitloggen'}
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="py-2"
                style={{ color: 'var(--foreground)' }}
              >
                Dashboard
              </Link>
              <Link
                href="/certificate"
                onClick={() => setMenuOpen(false)}
                className="py-2"
                style={{ color: 'var(--foreground)' }}
              >
                Certificaat
              </Link>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="py-2"
                style={{ color: 'var(--foreground)' }}
              >
                Profiel
              </Link>
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm block mb-2" style={{ color: 'var(--secondary)' }}>
                  Ingelogd als {userName || 'Gebruiker'}
                </span>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="btn-secondary text-sm w-full"
                >
                  {loading ? 'Uitloggen...' : 'Uitloggen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
