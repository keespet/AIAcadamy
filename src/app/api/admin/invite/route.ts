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

    // Search for existing user by email using paginated listUsers
    // This handles cases where there are more users than the default page size
    let existingUser: { id: string; email: string } | undefined
    let page = 1
    const perPage = 50 // Smaller batches are faster when user is found early

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

      const foundUser = usersPage.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (foundUser) {
        existingUser = { id: foundUser.id, email: foundUser.email || '' }
      }

      if (usersPage.users.length < perPage) break
      page++
    }

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

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabaseAdmin
      .from('organization_members')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .is('user_id', null)
      .single()

    if (existingInvite) {
      return NextResponse.json({
        error: 'Er is al een uitnodiging verstuurd naar dit emailadres'
      }, { status: 400 })
    }

    // First create the organization_members record with email (no user_id yet)
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        email: email.toLowerCase(),
        user_id: null,  // Will be set when user accepts invite
        role: 'participant',
        status: 'invited',
        invited_by: admin.userId
      } as never)

    if (memberError) {
      console.error('Member insert error:', memberError)
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    // Now send the invite email via Supabase Auth
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: fullName || null,
        invited_by: admin.userId
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`
    })

    if (inviteError) {
      // Rollback: delete the organization_members record if invite fails
      await supabaseAdmin
        .from('organization_members')
        .delete()
        .eq('email', email.toLowerCase())
        .is('user_id', null)

      return NextResponse.json({ error: inviteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Uitnodiging verstuurd naar ' + email
    })

  } catch (error) {
    console.error('Invite error:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Missing Supabase admin credentials')) {
        return NextResponse.json({
          error: 'Server configuratie fout: admin credentials ontbreken. Neem contact op met de beheerder.'
        }, { status: 500 })
      }
      if (error.message.includes('Invalid API key') || error.message.includes('service_role')) {
        return NextResponse.json({
          error: 'Server configuratie fout: ongeldige API key. Neem contact op met de beheerder.'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het versturen van de uitnodiging'
    }, { status: 500 })
  }
}
