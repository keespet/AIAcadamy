'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Module, UserProgress } from '@/types/database'

interface ModuleContentProps {
  module: Module
  userId: string
  initialProgress: UserProgress | null
}

const MIN_VIEW_TIME = 120 // 2 minutes in seconds

export default function ModuleContent({ module, userId, initialProgress }: ModuleContentProps) {
  const [viewTime, setViewTime] = useState(initialProgress?.view_time_seconds || 0)
  const [isTimerRunning] = useState(true) // Start running immediately
  const [isSaving, setIsSaving] = useState(false)
  const lastSaveTime = useRef(initialProgress?.view_time_seconds || 0)

  const canStartQuiz = viewTime >= MIN_VIEW_TIME
  const isCompleted = initialProgress?.quiz_completed && (initialProgress?.quiz_score ?? 0) >= 70

  // Save progress to database
  const saveProgress = useCallback(async (seconds: number) => {
    if (Math.abs(seconds - lastSaveTime.current) < 10) return // Only save if changed significantly

    setIsSaving(true)
    const supabase = createClient()

    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        module_id: module.id,
        view_time_seconds: seconds,
      } as never, {
        onConflict: 'user_id,module_id',
      })

    if (!error) {
      lastSaveTime.current = seconds
    }
    setIsSaving(false)
  }, [userId, module.id])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTimerRunning) {
      interval = setInterval(() => {
        setViewTime(prev => {
          const newTime = prev + 1
          // Save every 15 seconds
          if (newTime % 15 === 0) {
            saveProgress(newTime)
          }
          return newTime
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isTimerRunning, saveProgress])

  // Save on page unload
  useEffect(() => {
    const currentViewTime = viewTime

    const handleBeforeUnload = () => {
      // Use navigator.sendBeacon for reliable save on page unload
      const supabase = createClient()
      supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          module_id: module.id,
          view_time_seconds: currentViewTime,
        } as never, {
          onConflict: 'user_id,module_id',
        })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // Save progress when component unmounts
      saveProgress(currentViewTime)
    }
  }, [viewTime, userId, module.id, saveProgress])

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const timeRemaining = Math.max(0, MIN_VIEW_TIME - viewTime)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
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

        {/* Timer */}
        <div className="card flex items-center gap-4 md:flex-col md:items-end">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: canStartQuiz ? 'var(--success)' : 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="timer" style={{ color: canStartQuiz ? 'var(--success)' : 'var(--foreground)' }}>
              {formatTime(viewTime)}
            </span>
            {isSaving && (
              <span className="text-xs" style={{ color: 'var(--secondary)' }}>Opslaan...</span>
            )}
          </div>
          {!canStartQuiz && (
            <p className="text-sm" style={{ color: 'var(--secondary)' }}>
              Nog {formatTime(timeRemaining)} voordat je de toets kunt starten
            </p>
          )}
        </div>
      </div>

      {/* Completion badge */}
      {isCompleted && (
        <div className="mb-6 p-4 rounded-lg flex items-center gap-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <svg className="w-6 h-6" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold" style={{ color: 'var(--success)' }}>Module voltooid!</p>
            <p className="text-sm" style={{ color: 'var(--secondary)' }}>
              Je score: {initialProgress?.quiz_score}%
            </p>
          </div>
        </div>
      )}

      {/* Video embed */}
      <div className="card mb-6">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={module.gamma_embed_url}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            style={{ border: 0 }}
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      </div>

      {/* Quiz button */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Toets</h2>

        {canStartQuiz ? (
          <>
            <p className="mb-4" style={{ color: 'var(--secondary)' }}>
              Je hebt de presentatie lang genoeg bekeken. Je kunt nu de toets starten.
              Er zijn 5 vragen en je hebt minimaal 70% correct nodig om de module af te ronden.
            </p>
            <Link href={`/quiz/${module.id}`} className="btn-primary">
              {isCompleted ? 'Toets opnieuw maken' : 'Start toets'}
            </Link>
          </>
        ) : (
          <>
            <p className="mb-4" style={{ color: 'var(--secondary)' }}>
              Bekijk de presentatie nog even. Na minimaal 2 minuten kun je de toets starten.
            </p>
            <button disabled className="btn-primary opacity-50 cursor-not-allowed">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Toets nog niet beschikbaar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
