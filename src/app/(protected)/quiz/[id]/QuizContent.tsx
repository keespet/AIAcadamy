'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Module, Question } from '@/types/database'

interface QuizContentProps {
  module: Module
  questions: Question[]
  userId: string
  previousBestScore: number | null | undefined
}

type Answer = 'A' | 'B' | 'C' | 'D'

export default function QuizContent({ module, questions, userId, previousBestScore }: QuizContentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<(Answer | null)[]>(new Array(questions.length).fill(null))
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const selectedAnswer = answers[currentQuestionIndex]

  const handleSelectAnswer = (answer: Answer) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answer
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (selectedAnswer === null) return

    if (isLastQuestion) {
      // Calculate score and save
      finishQuiz()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const finishQuiz = async () => {
    setIsSaving(true)
    setSaveError(false)
    setSavedSuccessfully(false)

    // Calculate score
    let correctCount = 0
    questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correctCount++
      }
    })

    const scorePercentage = Math.round((correctCount / questions.length) * 100)
    setScore(scorePercentage)

    // Only save if this is better than previous best score
    const shouldSave = previousBestScore === null || previousBestScore === undefined || scorePercentage > previousBestScore

    if (shouldSave) {
      try {
        const response = await fetch('/api/progress/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            moduleId: module.id,
            quizScore: scorePercentage,
          }),
        })

        if (!response.ok) {
          console.error('Quiz save failed:', await response.text())
          setSaveError(true)
        } else {
          setSavedSuccessfully(true)
        }
      } catch (error) {
        console.error('Quiz save error:', error)
        setSaveError(true)
      }
    } else {
      // Score wasn't higher than previous, but that's OK
      setSavedSuccessfully(true)
    }

    setShowResult(true)
    setIsSaving(false)
  }

  const handleRetry = () => {
    setAnswers(new Array(questions.length).fill(null))
    setCurrentQuestionIndex(0)
    setShowResult(false)
    setScore(0)
    setSaveError(false)
    setSavedSuccessfully(false)
  }

  const isPassing = score >= 70

  if (showResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: isPassing ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            }}
          >
            {isPassing ? (
              <svg className="w-10 h-10" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-10 h-10" style={{ color: 'var(--error)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <h1 className="text-3xl font-bold mb-2">
            {isPassing ? 'Gefeliciteerd!' : 'Helaas...'}
          </h1>

          <p className="text-xl mb-6" style={{ color: 'var(--secondary)' }}>
            Je score: <span className="font-bold" style={{ color: isPassing ? 'var(--success)' : 'var(--error)' }}>{score}%</span>
          </p>

          {saveError && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <p className="font-semibold" style={{ color: 'var(--error)' }}>
                Let op: Er ging iets mis bij het opslaan van je score.
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--secondary)' }}>
                Probeer de toets opnieuw te maken. Als het probleem aanhoudt, neem contact op met de beheerder.
              </p>
            </div>
          )}

          {isPassing ? (
            <>
              <p className="mb-6" style={{ color: 'var(--secondary)' }}>
                {saveError
                  ? 'Je had een voldoende, maar je score kon niet worden opgeslagen. Probeer het opnieuw.'
                  : `Je hebt module "${module.title}" succesvol afgerond!`}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {saveError ? (
                  <button onClick={handleRetry} className="btn-primary">
                    Opnieuw proberen
                  </button>
                ) : (
                  <>
                    <Link href="/dashboard" className="btn-primary">
                      Terug naar dashboard
                    </Link>
                    <button onClick={handleRetry} className="btn-secondary">
                      Opnieuw proberen
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mb-6" style={{ color: 'var(--secondary)' }}>
                Je hebt minimaal 70% nodig om deze module af te ronden.
                Bekijk de presentatie nog een keer en probeer het opnieuw.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={handleRetry} className="btn-primary">
                  Opnieuw proberen
                </button>
                <Link href={`/module/${module.id}`} className="btn-secondary">
                  Terug naar presentatie
                </Link>
              </div>
            </>
          )}

          {/* Score breakdown */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold mb-4">Overzicht antwoorden</h2>
            <div className="space-y-2 text-left">
              {questions.map((question, index) => {
                const isCorrect = answers[index] === question.correct_answer
                return (
                  <div
                    key={question.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{
                      backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    }}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: isCorrect ? 'var(--success)' : 'var(--error)',
                        color: 'white',
                      }}
                    >
                      {isCorrect ? '✓' : '✗'}
                    </span>
                    <span className="text-sm flex-1">
                      Vraag {index + 1}: {isCorrect ? 'Correct' : `Fout (antwoord: ${question.correct_answer})`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/module/${module.id}`} className="text-sm mb-2 inline-flex items-center gap-1" style={{ color: 'var(--secondary)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Terug naar module
        </Link>
        <h1 className="text-2xl font-bold">Toets: {module.title}</h1>
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">Vraag {currentQuestionIndex + 1} van {questions.length}</span>
          <span className="text-sm" style={{ color: 'var(--secondary)' }}>
            {answers.filter(a => a !== null).length} beantwoord
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-6">{currentQuestion.question_text}</h2>

        <div className="space-y-3">
          {(['A', 'B', 'C', 'D'] as const).map((option) => {
            const optionText = currentQuestion[`option_${option.toLowerCase()}` as keyof Question] as string
            const isSelected = selectedAnswer === option

            return (
              <button
                key={option}
                onClick={() => handleSelectAnswer(option)}
                className={`quiz-option w-full text-left ${isSelected ? 'selected' : ''}`}
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--border)',
                    color: isSelected ? 'white' : 'var(--foreground)',
                  }}
                >
                  {option}
                </span>
                <span>{optionText}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="btn-secondary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Vorige
        </button>

        <button
          onClick={handleNext}
          disabled={selectedAnswer === null || isSaving}
          className="btn-primary"
        >
          {isSaving ? (
            <>
              <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
              Opslaan...
            </>
          ) : isLastQuestion ? (
            'Resultaat bekijken'
          ) : (
            <>
              Volgende
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Question dots */}
      <div className="flex justify-center gap-2 mt-6">
        {questions.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentQuestionIndex(index)}
            className="w-3 h-3 rounded-full transition-colors"
            style={{
              backgroundColor: answers[index] !== null
                ? 'var(--primary)'
                : index === currentQuestionIndex
                  ? 'var(--secondary)'
                  : 'var(--border)',
            }}
            aria-label={`Ga naar vraag ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
