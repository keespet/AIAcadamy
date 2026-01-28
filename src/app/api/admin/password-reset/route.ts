import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin'

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { userId } = body

  if (!userId) {
    return NextResponse.json({ error: 'userId is verplicht' }, { status: 400 })
  }

  try {
    const supabaseAdmin = createAdminClient()

    // Get user email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)

    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 })
    }

    // Verify user is a member of the organization
    const { data: member } = await supabaseAdmin
      .from('organization_members')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Gebruiker is geen deelnemer' }, { status: 400 })
    }

    // Send password reset email
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?next=/profile`
      }
    })

    if (resetError) {
      return NextResponse.json({ error: resetError.message }, { status: 500 })
    }

    // Actually send the reset email using resetPasswordForEmail
    const { error: emailError } = await supabaseAdmin.auth.resetPasswordForEmail(
      userData.user.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?next=/profile`
      }
    )

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Wachtwoord reset email verstuurd naar ' + userData.user.email
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het versturen van de reset email'
    }, { status: 500 })
  }
}
