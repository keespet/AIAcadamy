'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

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

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Dit emailadres is al geregistreerd')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="card text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <svg className="w-8 h-8" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Controleer je email</h2>
        <p style={{ color: 'var(--secondary)' }}>
          We hebben een bevestigingslink gestuurd naar <strong>{email}</strong>.
          Klik op de link om je account te activeren.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Terug naar inloggen
        </Link>
      </div>
    )
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
