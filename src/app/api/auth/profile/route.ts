import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, hashPassword, createToken, setAuthCookie } from '@/lib/auth'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
  })
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { fullName, newPassword } = body

    const supabase = createAdminClient()
    const updates: Record<string, unknown> = {}

    if (fullName !== undefined) {
      updates.full_name = fullName
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({
          error: 'Wachtwoord moet minimaal 6 tekens bevatten'
        }, { status: 400 })
      }
      updates.password_hash = await hashPassword(newPassword)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Geen wijzigingen' }, { status: 400 })
    }

    updates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('users')
      .update(updates as never)
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({
        error: 'Fout bij het bijwerken van profiel'
      }, { status: 500 })
    }

    // If name was updated, refresh the token
    if (fullName !== undefined) {
      const token = await createToken({
        userId: user.id,
        email: user.email,
        fullName: fullName,
        role: user.role,
      })
      await setAuthCookie(token)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden'
    }, { status: 500 })
  }
}
