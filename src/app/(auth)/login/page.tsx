'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorFromUrl = searchParams.get('error')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? 'Onjuiste email of wachtwoord'
        : error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-center">Inloggen</h2>

      {(error || errorFromUrl) && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
          {error || 'Er is een fout opgetreden bij het inloggen. Probeer het opnieuw.'}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="naam@voorbeeld.nl"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="label">Wachtwoord</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Je wachtwoord"
            required
          />
        </div>

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm" style={{ color: 'var(--primary)' }}>
            Wachtwoord vergeten?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
              Bezig met inloggen...
            </>
          ) : (
            'Inloggen'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--secondary)' }}>
        Nog geen account?{' '}
        <Link href="/register" style={{ color: 'var(--primary)' }}>
          Registreer hier
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="card">
        <div className="flex justify-center py-8">
          <div className="spinner"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
