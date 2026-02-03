'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Module, UserProgress } from '@/types/database'

interface ModuleContentProps {
  module: Module
  userId: string
  initialProgress: UserProgress | null
}

export default function ModuleContent({ module, initialProgress }: ModuleContentProps) {
  const router = useRouter()
  const [viewTime, setViewTime] = useState(initialProgress?.view_time_seconds || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const lastSaveTime = useRef(initialProgress?.view_time_seconds || 0)
  const viewTimeRef = useRef(initialProgress?.view_time_seconds || 0)

  const isCompleted = initialProgress?.quiz_completed && (initialProgress?.quiz_score ?? 0) >= 70

  // Keep ref in sync with state
  useEffect(() => {
    viewTimeRef.current = viewTime
  }, [viewTime])

  const saveProgress = useCallback(async (seconds: number, force = false) => {
    if (!force && Math.abs(seconds - lastSaveTime.current) < 10) return

    setIsSaving(true)

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          moduleId: module.id,
          viewTimeSeconds: seconds,
        }),
      })

      if (response.ok) {
        lastSaveTime.current = seconds
        setIsSaving(false)
        return true
      }
    } catch {
      // Silently fail, will retry on next interval
    }

    setIsSaving(false)
    return false
  }, [module.id])

  const navigateToQuiz = useCallback(async () => {
    setIsNavigating(true)
    // Force save current progress before navigating
    await saveProgress(viewTimeRef.current, true)
    router.push(`/quiz/${module.id}`)
  }, [saveProgress, router, module.id])

  // Timer that counts up and saves every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setViewTime(prev => {
        const newTime = prev + 1
        if (newTime % 15 === 0) {
          saveProgress(newTime)
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [saveProgress])

  // Save on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = JSON.stringify({
        moduleId: module.id,
        viewTimeSeconds: viewTimeRef.current,
      })
      navigator.sendBeacon('/api/progress', data)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress(viewTimeRef.current)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      saveProgress(viewTimeRef.current)
    }
  }, [module.id, saveProgress])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile: Compact sticky header with timer */}
      <div className="md:hidden sticky top-0 z-10 -mx-6 px-4 py-2 flex items-center justify-between" style={{ backgroundColor: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" className="text-sm flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug
        </Link>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-mono">
            {formatTime(viewTime)}
          </span>
          {isSaving && <span className="text-xs" style={{ color: 'var(--secondary)' }}>...</span>}
        </div>
        <button
          onClick={navigateToQuiz}
          disabled={isNavigating}
          className="text-sm font-medium px-3 py-1 rounded"
          style={{ backgroundColor: 'var(--primary)', color: 'white', opacity: isNavigating ? 0.7 : 1 }}
        >
          {isNavigating ? '...' : 'Toets'}
        </button>
      </div>

      {/* Desktop: Full header */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <Link href="/dashboard" className="text-sm mb-2 inline-flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Terug naar dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">
            Module {module.order_number}: {module.title}
          </h1>
          <p className="mt-1" style={{ color: 'var(--secondary)' }}>{module.description}</p>
        </div>

        <div className="card flex items-center gap-4 md:flex-col md:items-end">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="timer">
              {formatTime(viewTime)}
            </span>
            {isSaving && (
              <span className="text-xs" style={{ color: 'var(--secondary)' }}>Opslaan...</span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'var(--secondary)' }}>
            Tijd besteed aan module
          </p>
        </div>
      </div>

      {/* Mobile: Title */}
      <div className="md:hidden mt-4 mb-4">
        <h1 className="text-xl font-bold">
          Module {module.order_number}: {module.title}
        </h1>
      </div>

      {/* Completion badge */}
      {isCompleted && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <svg className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-sm md:text-base" style={{ color: 'var(--success)' }}>Module voltooid! Score: {initialProgress?.quiz_score}%</p>
          </div>
        </div>
      )}

      {/* Video embed - takes most space */}
      <div className="card flex-1 mb-4 md:mb-6 p-2 md:p-6">
        {/* Mobile: use viewport height for better visibility */}
        <div className="md:hidden relative w-full" style={{ height: '65vh', minHeight: '350px' }}>
          <iframe
            src={module.gamma_embed_url}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            style={{ border: 0 }}
            allow="fullscreen"
            allowFullScreen
          />
        </div>
        {/* Desktop: use aspect ratio */}
        <div className="hidden md:block relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={module.gamma_embed_url}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            style={{ border: 0 }}
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      </div>

      {/* Quiz button - always visible */}
      <div className="hidden md:block card">
        <h2 className="text-xl font-semibold mb-4">Toets</h2>
        <p className="mb-4" style={{ color: 'var(--secondary)' }}>
          Er zijn 5 vragen en je hebt minimaal 70% correct nodig om de module af te ronden.
        </p>
        <button onClick={navigateToQuiz} disabled={isNavigating} className="btn-primary" style={{ opacity: isNavigating ? 0.7 : 1 }}>
          {isNavigating ? 'Even geduld...' : (isCompleted ? 'Toets opnieuw maken' : 'Start toets')}
        </button>
      </div>

      {/* Mobile: Quiz button always visible */}
      <div className="md:hidden card p-4">
        <p className="text-sm mb-3" style={{ color: 'var(--secondary)' }}>
          5 vragen, minimaal 70% correct nodig.
        </p>
        <button onClick={navigateToQuiz} disabled={isNavigating} className="btn-primary w-full text-center" style={{ opacity: isNavigating ? 0.7 : 1 }}>
          {isNavigating ? 'Even geduld...' : (isCompleted ? 'Toets opnieuw maken' : 'Start toets')}
        </button>
      </div>
    </div>
  )
}
