import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin'
import { generateSecureToken, hashToken, getTokenExpiry } from '@/lib/tokens'
import { sendEmail } from '@/lib/email'
import { getInviteEmailHtml, getInviteEmailText } from '@/lib/email-templates/invite'

interface ExistingMember {
  id: number
  status: string
  token_expires_at: string | null
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

    // Search for existing user by email using paginated listUsers
    let existingUser: { id: string; email: string } | undefined
    let page = 1
    const perPage = 50

    while (!existingUser) {
      const { data: usersPage, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage
      })

      if (listError) {
        console.error('Error listing users:', listError)
        break
      }

      if (!usersPage?.users?.length) break

      const foundUser = usersPage.users.find(u => u.email?.toLowerCase() === normalizedEmail)
      if (foundUser) {
        existingUser = { id: foundUser.id, email: foundUser.email || '' }
      }

      if (usersPage.users.length < perPage) break
      page++
    }

    // If user already exists in Supabase Auth
    if (existingUser) {
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id, status')
        .eq('user_id', existingUser.id)
        .single() as { data: ExistingMember | null }

      if (existingMember) {
        if (existingMember.status === 'inactive') {
          await supabaseAdmin
            .from('organization_members')
            .update({ status: 'active' } as never)
            .eq('id', existingMember.id)

          return NextResponse.json({
            success: true,
            message: 'Deelnemer is opnieuw geactiveerd'
          })
        }
        return NextResponse.json({
          error: 'Deze gebruiker is al een deelnemer'
        }, { status: 400 })
      }

      // Add existing user as active member (no invite needed)
      const { error: memberError } = await supabaseAdmin
        .from('organization_members')
        .insert({
          user_id: existingUser.id,
          role: 'participant',
          status: 'active',
          invited_by: admin.userId,
          joined_at: new Date().toISOString()
        } as never)

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Bestaande gebruiker toegevoegd als deelnemer'
      })
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabaseAdmin
      .from('organization_members')
      .select('id, status, token_expires_at')
      .eq('email', normalizedEmail)
      .is('user_id', null)
      .single() as { data: ExistingMember | null }

    if (existingInvite) {
      // Check if invite is expired - allow resend if expired
      const isExpired = existingInvite.token_expires_at &&
        new Date(existingInvite.token_expires_at) < new Date()

      if (!isExpired) {
        return NextResponse.json({
          error: 'Er is al een actieve uitnodiging voor dit emailadres'
        }, { status: 400 })
      }

      // Delete expired invite to allow fresh one
      await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('id', existingInvite.id)
    }

    // Generate secure token
    const rawToken = generateSecureToken()
    const hashedToken = hashToken(rawToken)
    const expiryHours = parseInt(process.env.INVITE_TOKEN_EXPIRY_HOURS || '72')
    const tokenExpiry = getTokenExpiry(expiryHours)

    // Create organization_members record with token
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        email: normalizedEmail,
        user_id: null,
        role: 'participant',
        status: 'invited',
        invited_by: admin.userId,
        invite_token: hashedToken,
        token_expires_at: tokenExpiry.toISOString()
      } as never)

    if (memberError) {
      console.error('Member insert error:', memberError)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
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
      // Rollback: delete the organization_members record if email fails
      await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('email', normalizedEmail)
        .is('user_id', null)

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
