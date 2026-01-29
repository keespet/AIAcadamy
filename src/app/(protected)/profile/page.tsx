'use client'

import { useEffect, useState } from 'react'

interface UserProfile {
  id: string
  email: string
  fullName: string | null
  role: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch('/api/auth/profile')
      if (res.ok) {
        const data = await res.json()
        setUser(data)
        setFullName(data.fullName || '')
      }
      setLoading(false)
    }

    fetchProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName }),
    })

    const data = await res.json()

    if (data.error) {
      setMessage({ type: 'error', text: data.error })
    } else {
      setMessage({ type: 'success', text: 'Je profiel is bijgewerkt!' })
    }

    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Wachtwoorden komen niet overeen.' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Wachtwoord moet minimaal 6 tekens bevatten.' })
      return
    }

    setChangingPassword(true)

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword }),
    })

    const data = await res.json()

    if (data.error) {
      setMessage({ type: 'error', text: data.error })
    } else {
      setMessage({ type: 'success', text: 'Je wachtwoord is gewijzigd!' })
      setNewPassword('')
      setConfirmPassword('')
    }

    setChangingPassword(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profiel</h1>

      {message && (
        <div
          className="mb-6 p-4 rounded-lg"
          style={{
            backgroundColor: message.type === 'success'
              ? 'rgba(34, 197, 94, 0.1)'
              : 'rgba(239, 68, 68, 0.1)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--error)',
          }}
        >
          {message.text}
        </div>
      )}

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Persoonlijke gegevens</h2>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              className="input"
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p className="text-sm mt-1" style={{ color: 'var(--secondary)' }}>
              Email kan niet worden gewijzigd
            </p>
          </div>

          <div>
            <label htmlFor="fullName" className="label">Volledige naam</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="Je volledige naam"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Opslaan...' : 'Wijzigingen opslaan'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Wachtwoord wijzigen</h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="label">Nieuw wachtwoord</label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="Minimaal 6 tekens"
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">Bevestig nieuw wachtwoord</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Herhaal je nieuwe wachtwoord"
            />
          </div>

          <button
            type="submit"
            disabled={changingPassword || !newPassword}
            className="btn-primary"
          >
            {changingPassword ? 'Wachtwoord wijzigen...' : 'Wachtwoord wijzigen'}
          </button>
        </form>
      </div>
    </div>
  )
}
