import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin'
import { hashPassword } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'

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
  const { email, fullName, password } = body

  if (!email || !fullName || !password) {
    return NextResponse.json({ error: 'Alle velden zijn verplicht' }, { status: 400 })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Ongeldig emailadres' }, { status: 400 })
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Wachtwoord moet minimaal 6 tekens bevatten' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  try {
    const supabaseAdmin = createAdminClient()

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email, status')
      .eq('email', normalizedEmail)
      .single() as { data: ExistingUser | null }

    if (existingUser) {
      if (existingUser.status === 'inactive') {
        // Reactivate inactive user
        const passwordHash = await hashPassword(password)
        await supabaseAdmin
          .from('users')
          .update({
            status: 'active',
            password_hash: passwordHash,
            full_name: fullName,
            updated_at: new Date().toISOString()
          } as never)
          .eq('id', existingUser.id)

        return NextResponse.json({
          success: true,
          message: 'Deelnemer is opnieuw geactiveerd'
        })
      }

      return NextResponse.json({
        error: 'Dit emailadres is al geregistreerd'
      }, { status: 400 })
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const userId = uuidv4()

    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'participant',
        status: 'active',
      } as never)

    if (insertError) {
      console.error('User insert error:', insertError)
      return NextResponse.json({ error: 'Fout bij het aanmaken van de deelnemer' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Deelnemer ${fullName} is toegevoegd`
    })

  } catch (error) {
    console.error('Add participant error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het toevoegen van de deelnemer'
    }, { status: 500 })
  }
}
