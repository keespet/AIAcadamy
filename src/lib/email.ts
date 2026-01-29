import nodemailer from 'nodemailer'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// Create reusable transporter
function createTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || '587')
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('SMTP configuratie ontbreekt. Controleer SMTP_HOST, SMTP_USER en SMTP_PASS.')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const transporter = createTransporter()

  const fromName = process.env.SMTP_FROM_NAME || 'AI Academy'
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
  })
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    return true
  } catch (error) {
    console.error('SMTP verification failed:', error)
    return false
  }
}
