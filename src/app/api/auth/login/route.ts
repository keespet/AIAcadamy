import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth'

interface LoginBody {
  email: string
  password: string
}

interface UserRecord {
  id: string
  email: string
  password_hash: string
  full_name: string | null
  role: 'admin' | 'participant'
  status: 'active' | 'inactive' | 'pending'
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginBody = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({
        error: 'Email en wachtwoord zijn verplicht'
      }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, role, status')
      .eq('email', email.toLowerCase())
      .single() as { data: UserRecord | null; error: Error | null }

    if (error || !user) {
      return NextResponse.json({
        error: 'Onjuiste email of wachtwoord'
      }, { status: 401 })
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json({
        error: 'Je account is nog niet geactiveerd'
      }, { status: 401 })
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json({
        error: 'Onjuiste email of wachtwoord'
      }, { status: 401 })
    }

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
    })

    // Set auth cookie
    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het inloggen'
    }, { status: 500 })
  }
}
