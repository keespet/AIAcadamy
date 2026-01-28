import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin'

interface ExistingMember {
  id: number
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

  try {
    const supabaseAdmin = createAdminClient()

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // Check if already a member
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id, status')
        .eq('user_id', existingUser.id)
        .single() as { data: ExistingMember | null }

      if (existingMember) {
        if (existingMember.status === 'inactive') {
          // Reactivate the member
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

      // Add existing user as member
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

    // Create new user with invite
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || null,
        invited_by: admin.userId
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Kon gebruiker niet aanmaken' }, { status: 500 })
    }

    // Add to organization_members with pending status
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        user_id: newUser.user.id,
        role: 'participant',
        status: 'pending',
        invited_by: admin.userId
      } as never)

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Uitnodiging verstuurd naar ' + email
    })

  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het versturen van de uitnodiging'
    }, { status: 500 })
  }
}
