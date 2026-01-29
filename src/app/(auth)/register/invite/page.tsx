'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function InviteRegisterContent() {
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [tokenError, setTokenError] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setTokenError('Geen uitnodigingstoken gevonden')
        setValidating(false)
        return
      }

      try {
        const res = await fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        if (!data.valid) {
          const errorMsg = typeof data.error === 'string' ? data.error : 'Ongeldige uitnodiging'
          setTokenError(errorMsg)
        } else {
          setEmail(data.email)
        }
      } catch {
        setTokenError('Fout bij het valideren van de uitnodiging')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens bevatten')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/invite/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, fullName })
      })

      const data = await res.json()

      if (data.error) {
        const errorMsg = typeof data.error === 'string' ? data.error : 'Er is een fout opgetreden'
        setError(errorMsg)
        setLoading(false)
        return
      }

      setSuccess(true)
      // Redirect to dashboard after 2 seconds (user is now logged in)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 2000)
    } catch {
      setError('Er is een fout opgetreden')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="card text-center">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p style={{ color: 'var(--secondary)' }}>Uitnodiging valideren...</p>
      </div>
    )
  }

  if (tokenError) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Ongeldige uitnodiging</h2>
        <p style={{ color: 'var(--secondary)' }} className="mb-4">{tokenError}</p>
        <p className="text-sm" style={{ color: 'var(--secondary)' }}>
          Neem contact op met je beheerder voor een nieuwe uitnodiging.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Naar inloggen
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
             style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Account aangemaakt!</h2>
        <p style={{ color: 'var(--secondary)' }}>
          Je account is succesvol aangemaakt. Je wordt doorgestuurd naar het dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-2 text-center">Welkom bij AI Academy</h2>
      <p className="text-center mb-6" style={{ color: 'var(--secondary)' }}>
        Maak je account aan voor <strong>{email}</strong>
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm"
             style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="label">Volledige naam</label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input"
            placeholder="Jan Jansen"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            type="email"
            value={email || ''}
            className="input"
            disabled
            style={{ backgroundColor: 'var(--muted)', cursor: 'not-allowed' }}
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
            placeholder="Minimaal 6 tekens"
            required
            minLength={6}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">Bevestig wachtwoord</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="Herhaal je wachtwoord"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Account aanmaken...' : 'Account aanmaken'}
        </button>
      </form>
    </div>
  )
}

export default function InviteRegisterPage() {
  return (
    <Suspense fallback={
      <div className="card text-center">
        <div className="flex justify-center mb-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p style={{ color: 'var(--secondary)' }}>Laden...</p>
      </div>
    }>
      <InviteRegisterContent />
    </Suspense>
  )
}
