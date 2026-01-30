'use client'

import { useState, useEffect } from 'react'

interface Participant {
  id: string  // UUID string
  userId: string
  email: string
  fullName: string
  role: string
  status: string
  invitedAt: string
  joinedAt: string | null
  totalModules: number
  completedModules: number
  progressPercentage: number
  hasCertificate: boolean
  lastActivity: string | null
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchParticipants = async () => {
    try {
      const res = await fetch('/api/admin/members')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setParticipants(data.participants)
      }
    } catch {
      setError('Fout bij het ophalen van deelnemers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [])

  const handleStatusChange = async (memberId: string, newStatus: string) => {
    setActionLoading(memberId)
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, status: newStatus })
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        fetchParticipants()
      }
    } catch {
      alert('Fout bij het wijzigen van de status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (memberId: string, name: string) => {
    if (!confirm(`Weet je zeker dat je ${name} wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.error) {
        alert(data.error)
      } else {
        fetchParticipants()
      }
    } catch {
      alert('Fout bij het verwijderen van de deelnemer')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      active: { bg: 'rgba(34, 197, 94, 0.1)', text: 'var(--success)' },
      inactive: { bg: 'rgba(239, 68, 68, 0.1)', text: 'var(--error)' },
      pending: { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--accent)' }
    }
    const style = styles[status] || styles.pending
    const labels: Record<string, string> = {
      active: 'Actief',
      inactive: 'Inactief',
      pending: 'In afwachting'
    }

    return (
      <span
        className="px-2 py-1 rounded text-xs font-medium"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
        <p style={{ color: 'var(--error)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Deelnemers</h1>
        <span style={{ color: 'var(--secondary)' }}>{participants.length} deelnemers</span>
      </div>

      {participants.length === 0 ? (
        <div className="card text-center py-8">
          <p style={{ color: 'var(--secondary)' }}>Nog geen deelnemers</p>
        </div>
      ) : (
        <div className="space-y-4">
          {participants.map(participant => (
            <div key={participant.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{participant.fullName}</h3>
                    {getStatusBadge(participant.status)}
                    {participant.hasCertificate && (
                      <span
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}
                      >
                        Gecertificeerd
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm" style={{ color: 'var(--secondary)' }}>
                    <div>
                      <span className="block text-xs">Gestart</span>
                      {participant.joinedAt ? new Date(participant.joinedAt).toLocaleDateString('nl-NL') : '-'}
                    </div>
                    <div>
                      <span className="block text-xs">Voortgang</span>
                      {participant.completedModules}/{participant.totalModules} modules ({participant.progressPercentage}%)
                    </div>
                    <div>
                      <span className="block text-xs">Laatste activiteit</span>
                      {participant.lastActivity ? new Date(participant.lastActivity).toLocaleDateString('nl-NL') : '-'}
                    </div>
                    <div>
                      <span className="block text-xs">Uitgenodigd</span>
                      {new Date(participant.invitedAt).toLocaleDateString('nl-NL')}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {participant.status === 'active' ? (
                    <button
                      onClick={() => handleStatusChange(participant.id, 'inactive')}
                      disabled={actionLoading === participant.id}
                      className="btn-secondary text-sm py-2 px-3"
                    >
                      {actionLoading === participant.id ? '...' : 'Deactiveren'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(participant.id, 'active')}
                      disabled={actionLoading === participant.id}
                      className="btn-secondary text-sm py-2 px-3"
                    >
                      {actionLoading === participant.id ? '...' : 'Activeren'}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(participant.id, participant.fullName)}
                    className="text-sm py-2 px-3 rounded"
                    style={{ color: 'var(--error)', border: '1px solid var(--error)' }}
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${participant.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
