'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/profile`,
    })

    if (error) {
      setError(error.message)
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Check je email</h2>
        <p style={{ color: 'var(--secondary)' }}>
          Als er een account bestaat voor <strong>{email}</strong>,
          ontvang je een link om je wachtwoord te resetten.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-block">
          Terug naar inloggen
        </Link>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold mb-2 text-center">Wachtwoord vergeten?</h2>
      <p className="text-center mb-6" style={{ color: 'var(--secondary)' }}>
        Vul je emailadres in en we sturen je een reset link.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
              Bezig met verzenden...
            </>
          ) : (
            'Verstuur reset link'
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--secondary)' }}>
        Weet je je wachtwoord weer?{' '}
        <Link href="/login" style={{ color: 'var(--primary)' }}>
          Log hier in
        </Link>
      </p>
    </div>
  )
}
