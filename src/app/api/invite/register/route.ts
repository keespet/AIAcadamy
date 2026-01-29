import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken, isValidTokenFormat } from '@/lib/tokens'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'

interface RegisterBody {
  token: string
  password: string
  fullName: string
}

interface UserRecord {
  id: string
  email: string | null
  status: string
  token_expires_at: string | null
  full_name: string | null
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
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, status, token_expires_at, full_name')
      .eq('invite_token', hashedToken)
      .eq('status', 'pending')
      .single() as { data: UserRecord | null; error: Error | null }

    if (userError || !user) {
      return NextResponse.json({
        error: 'Uitnodiging niet gevonden of al gebruikt'
      }, { status: 404 })
    }

    // Check expiration
    if (user.token_expires_at && new Date(user.token_expires_at) < new Date()) {
      return NextResponse.json({
        error: 'Deze uitnodiging is verlopen'
      }, { status: 410 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Update user: set password, clear token, set status to active
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        full_name: fullName,
        status: 'active',
        invite_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', user.id)

    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json({
        error: 'Fout bij het voltooien van de registratie'
      }, { status: 500 })
    }

    // Create JWT token and log user in
    const jwtToken = await createToken({
      userId: user.id,
      email: user.email!,
      fullName: fullName,
      role: 'participant',
    })

    await setAuthCookie(jwtToken)

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
