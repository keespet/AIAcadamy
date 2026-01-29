'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      // User is automatically logged in after registration
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Er is een fout opgetreden bij het registreren')
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-6 text-center">Registreren</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
              Bezig met registreren...
            </>
          ) : (
            'Registreren'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--secondary)' }}>
        Al een account?{' '}
        <Link href="/login" style={{ color: 'var(--primary)' }}>
          Log hier in
        </Link>
      </p>
    </div>
  )
}
