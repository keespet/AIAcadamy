import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin'
import { generateSecureToken, hashToken, getTokenExpiry } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { getInviteEmailHtml, getInviteEmailText } from '@/lib/email-templates/invite'

interface ExistingUser {
  id: string
  email: string
  status: string
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { email, fullName } = body

  if (!email) {
    return NextResponse.json({ error: 'Email is verplicht' }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Ongeldig emailadres' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const supabaseAdmin = createAdminClient()

    // Check if user already exists in our users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, status')
      .eq('email', normalizedEmail)
      .single() as { data: ExistingUser | null }

    // If user already exists
    if (existingUser) {
      if (existingUser.status === 'inactive') {
        await supabaseAdmin
          .from('users')
          .update({ status: 'active' } as never)
          .eq('id', existingUser.id)

        return NextResponse.json({
          success: true,
          message: 'Deelnemer is opnieuw geactiveerd'
        })
      }

      return NextResponse.json({
        error: 'Deze gebruiker is al geregistreerd'
      }, { status: 400 })
    }

    // Check for existing pending invite (user with status 'pending')
    const { data: pendingUser } = await supabaseAdmin
      .from('users')
      .select('id, status, created_at')
      .eq('email', normalizedEmail)
      .eq('status', 'pending')
      .single() as { data: { id: string; status: string; created_at: string } | null }

    if (pendingUser) {
      // Check if invite is older than expiry (default 72 hours)
      const expiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '72')
      const createdAt = new Date(pendingUser.created_at)
      const expiryTime = new Date(createdAt.getTime() + expiryHours * 60 * 60 * 1000)
      const isExpired = new Date() > expiryTime

      if (!isExpired) {
        return NextResponse.json({
          error: 'Er is al een actieve uitnodiging voor dit emailadres'
        }, { status: 400 })
      }

      // Delete expired pending user to allow fresh invite
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', pendingUser.id)
    }

    // Generate secure token
    const rawToken = generateSecureToken()
    const hashedToken = hashToken(rawToken)
    const expiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '72')
    const tokenExpiry = getTokenExpiry(expiryHours)

    // Create pending user with invite token
    const { v4: uuidv4 } = await import('uuid')
    const userId = uuidv4()

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: normalizedEmail,
        password_hash: '', // Will be set during registration
        full_name: fullName || null,
        role: 'participant',
        status: 'pending',
        invite_token: hashedToken,
        token_expires_at: tokenExpiry.toISOString(),
        invited_by: admin.userId,
      } as never)

    if (insertError) {
      console.error('User insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Build invite URL with raw token
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const inviteUrl = `${siteUrl}/register/invite?token=${rawToken}`

    // Send invite email via SMTP
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'Uitnodiging voor AI Academy',
        html: getInviteEmailHtml({ inviteUrl, fullName, expiryHours }),
        text: getInviteEmailText({ inviteUrl, fullName, expiryHours })
      })
    } catch (emailError) {
      // Rollback: delete the user record if email fails
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId)

      const errorMessage = emailError instanceof Error ? emailError.message : 'Onbekende fout'
      console.error('Email send error:', errorMessage)

      return NextResponse.json({
        error: `Fout bij het versturen van de email: ${errorMessage}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Uitnodiging verstuurd naar ' + normalizedEmail
    })

  } catch (error) {
    console.error('Invite error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Missing Supabase admin credentials')) {
        return NextResponse.json({
          error: 'Server configuratie fout: admin credentials ontbreken.'
        }, { status: 500 })
      }
      if (error.message.includes('SMTP')) {
        return NextResponse.json({
          error: 'Email configuratie fout: ' + error.message
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het versturen van de uitnodiging'
    }, { status: 500 })
  }
}
