'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddParticipantPage() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 tekens bevatten' })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, password })
      })

      const data = await res.json()

      if (data.error) {
        setMessage({ type: 'error', text: data.error })
      } else {
        setMessage({ type: 'success', text: data.message })
        setEmail('')
        setFullName('')
        setPassword('')
        // Redirect to participants after 2 seconds
        setTimeout(() => {
          router.push('/admin/participants')
        }, 2000)
      }
    } catch {
      setMessage({ type: 'error', text: 'Er is een fout opgetreden' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Nieuwe deelnemer toevoegen</h1>

      <div className="card max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="label">
              Volledige naam <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Jan Jansen"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="deelnemer@voorbeeld.nl"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Wachtwoord <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Minimaal 6 tekens"
              required
              minLength={6}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--secondary)' }}>
              Deel dit wachtwoord met de deelnemer
            </p>
          </div>

          {message && (
            <div
              className="p-3 rounded"
              style={{
                backgroundColor: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? 'var(--success)' : 'var(--error)'
              }}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !fullName || !password}
            className="btn-primary w-full"
          >
            {loading ? 'Toevoegen...' : 'Deelnemer toevoegen'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <h3 className="font-medium mb-2">Na het toevoegen:</h3>
          <ul className="text-sm space-y-2" style={{ color: 'var(--secondary)' }}>
            <li>• Deel het email en wachtwoord met de deelnemer</li>
            <li>• De deelnemer kan inloggen op {typeof window !== 'undefined' ? window.location.origin : ''}/login</li>
            <li>• Het wachtwoord kan later gewijzigd worden in het profiel</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
