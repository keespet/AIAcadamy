import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken, isValidTokenFormat } from '@/lib/tokens'

interface RegisterBody {
  token: string
  password: string
  fullName: string
}

interface InviteRecord {
  id: number
  email: string | null
  status: string
  token_expires_at: string | null
}

export async function POST(request: NextRequest) {
  const body: RegisterBody = await request.json()
  const { token, password, fullName } = body

  // Validate inputs
  if (!token || !password || !fullName) {
    return NextResponse.json({
      error: 'Alle velden zijn verplicht'
    }, { status: 400 })
  }

  if (!isValidTokenFormat(token)) {
    return NextResponse.json({
      error: 'Ongeldig token'
    }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({
      error: 'Wachtwoord moet minimaal 6 tekens bevatten'
    }, { status: 400 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const hashedToken = hashToken(token)

    // Find and validate invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('organization_members')
      .select('id, email, status, token_expires_at')
      .eq('invite_token', hashedToken)
      .is('user_id', null)
      .single() as { data: InviteRecord | null; error: Error | null }

    if (inviteError || !invite) {
      return NextResponse.json({
        error: 'Uitnodiging niet gevonden of al gebruikt'
      }, { status: 404 })
    }

    // Check expiration
    if (invite.token_expires_at && new Date(invite.token_expires_at) < new Date()) {
      return NextResponse.json({
        error: 'Deze uitnodiging is verlopen'
      }, { status: 410 })
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email!,
      password: password,
      email_confirm: true, // Auto-confirm since they were invited
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({
          error: 'Dit emailadres is al geregistreerd'
        }, { status: 400 })
      }
      console.error('Auth create error:', authError)
      return NextResponse.json({
        error: 'Fout bij het aanmaken van het account'
      }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({
        error: 'Fout bij het aanmaken van het account'
      }, { status: 500 })
    }

    // Update organization_members: link user_id, clear token, set status
    const { error: updateError } = await supabaseAdmin
      .from('organization_members')
      .update({
        user_id: authData.user.id,
        status: 'active',
        joined_at: new Date().toISOString(),
        invite_token: null,
        token_expires_at: null
      } as never)
      .eq('id', invite.id)

    if (updateError) {
      // Rollback: delete the auth user if member update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Member update error:', updateError)
      return NextResponse.json({
        error: 'Fout bij het voltooien van de registratie'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Account succesvol aangemaakt'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij de registratie'
    }, { status: 500 })
  }
}
