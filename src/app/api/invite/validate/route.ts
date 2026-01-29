import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken, isValidTokenFormat } from '@/lib/tokens'

interface InviteRecord {
  id: number
  email: string | null
  status: string
  token_expires_at: string | null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ valid: false, error: 'Token is verplicht' }, { status: 400 })
  }

  if (!isValidTokenFormat(token)) {
    return NextResponse.json({ valid: false, error: 'Ongeldig token formaat' }, { status: 400 })
  }

  try {
    const supabaseAdmin = createAdminClient()
    const hashedToken = hashToken(token)

    // Find invite by hashed token
    const { data: invite, error } = await supabaseAdmin
      .from('organization_members')
      .select('id, email, status, token_expires_at')
      .eq('invite_token', hashedToken)
      .is('user_id', null)
      .single() as { data: InviteRecord | null; error: Error | null }

    if (error || !invite) {
      return NextResponse.json({
        valid: false,
        error: 'Uitnodiging niet gevonden of al gebruikt'
      }, { status: 404 })
    }

    // Check expiration
    if (invite.token_expires_at && new Date(invite.token_expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Deze uitnodiging is verlopen'
      }, { status: 410 })
    }

    return NextResponse.json({
      valid: true,
      email: invite.email
    })

  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json({
      valid: false,
      error: 'Fout bij het valideren van de uitnodiging'
    }, { status: 500 })
  }
}
