'use client'

import { useState } from 'react'
import Link from 'next/link'
import { jsPDF } from 'jspdf'

interface CertificateContentProps {
  userName: string
  averageScore: number
  verificationCode: string
  issuedAt: string
}

export default function CertificateContent({
  userName,
  averageScore,
  verificationCode,
  issuedAt,
}: CertificateContentProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const formattedDate = new Date(issuedAt).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const downloadCertificate = async () => {
    setIsGenerating(true)

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      // Background
      doc.setFillColor(248, 250, 252)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')

      // Border
      doc.setDrawColor(245, 158, 11) // Accent color
      doc.setLineWidth(3)
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20)

      // Inner border
      doc.setLineWidth(0.5)
      doc.rect(15, 15, pageWidth - 30, pageHeight - 30)

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(36)
      doc.setTextColor(37, 99, 235) // Primary color
      doc.text('AI Academy', pageWidth / 2, 45, { align: 'center' })

      // Certificate text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(16)
      doc.setTextColor(71, 85, 105)
      doc.text('CERTIFICAAT VAN VOLTOOIING', pageWidth / 2, 60, { align: 'center' })

      // Decorative line
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.5)
      doc.line(pageWidth / 2 - 50, 67, pageWidth / 2 + 50, 67)

      // This certifies
      doc.setFontSize(14)
      doc.text('Hierbij verklaren wij dat', pageWidth / 2, 85, { align: 'center' })

      // Name
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.setTextColor(15, 23, 42)
      doc.text(userName, pageWidth / 2, 105, { align: 'center' })

      // Completion text
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(14)
      doc.setTextColor(71, 85, 105)
      doc.text('de AI Academy succesvol heeft afgerond', pageWidth / 2, 120, { align: 'center' })

      // Score
      doc.setFontSize(12)
      doc.text(`met een gemiddelde score van ${averageScore}%`, pageWidth / 2, 132, { align: 'center' })

      // Date
      doc.text(`Uitgereikt op ${formattedDate}`, pageWidth / 2, 150, { align: 'center' })

      // Verification code
      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Verificatiecode: ${verificationCode}`, pageWidth / 2, 170, { align: 'center' })

      // Footer
      doc.setFontSize(8)
      doc.text('Dit certificaat bevestigt de succesvolle voltooiing van alle 6 modules van de AI Academy.', pageWidth / 2, pageHeight - 25, { align: 'center' })

      // Save
      doc.save(`AI-Academy-Certificaat-${userName.replace(/\s+/g, '-')}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Er is een fout opgetreden bij het genereren van het certificaat.')
    }

    setIsGenerating(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
          <svg className="w-10 h-10" style={{ color: 'var(--success)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">Gefeliciteerd, {userName.split(' ')[0]}!</h1>
        <p style={{ color: 'var(--secondary)' }}>
          Je hebt de AI Academy succesvol afgerond met een gemiddelde score van {averageScore}%.
        </p>
      </div>

      {/* Certificate preview */}
      <div className="certificate card mb-8" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', border: '3px solid var(--accent)' }}>
        <div className="py-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--primary)' }}>AI Academy</h2>
          <p className="text-sm uppercase tracking-wider mb-6" style={{ color: 'var(--secondary)' }}>Certificaat van Voltooiing</p>

          <div className="my-8">
            <p className="mb-2" style={{ color: 'var(--secondary)' }}>Hierbij verklaren wij dat</p>
            <p className="text-2xl font-bold mb-2">{userName}</p>
            <p style={{ color: 'var(--secondary)' }}>de AI Academy succesvol heeft afgerond</p>
            <p className="text-sm mt-2" style={{ color: 'var(--secondary)' }}>met een gemiddelde score van {averageScore}%</p>
          </div>

          <p className="text-sm mb-4" style={{ color: 'var(--secondary)' }}>Uitgereikt op {formattedDate}</p>

          <p className="text-xs" style={{ color: 'var(--secondary)' }}>
            Verificatiecode: <span className="font-mono">{verificationCode}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={downloadCertificate}
          disabled={isGenerating}
          className="btn-primary"
        >
          {isGenerating ? (
            <>
              <span className="spinner" style={{ width: '1rem', height: '1rem' }}></span>
              Genereren...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF
            </>
          )}
        </button>

        <Link href="/dashboard" className="btn-secondary">
          Terug naar dashboard
        </Link>
      </div>

      {/* Info */}
      <div className="mt-8 p-4 rounded-lg text-sm text-center" style={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)' }}>
        <p style={{ color: 'var(--secondary)' }}>
          Dit certificaat kan worden geverifieerd met de unieke verificatiecode.
          Bewaar deze code goed voor toekomstige referentie.
        </p>
      </div>
    </div>
  )
}
