'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

function getSnapshot() {
  return !navigator.onLine
}

function getServerSnapshot() {
  return false // Assume online during SSR
}

export default function OfflineIndicator() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!isOffline) return null

  return (
    <div className="offline-banner">
      Je bent offline. Sommige functies zijn mogelijk niet beschikbaar.
    </div>
  )
}
