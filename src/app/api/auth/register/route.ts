import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import { rateLimit, REGISTER_RATE_LIMIT } from '@/lib/rate-limit'

interface RegisterBody {
  email: string
  password: string
  fullName: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP address (stricter for registration)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    const rateLimitResult = rateLimit(`register:${ip}`, REGISTER_RATE_LIMIT)
    if (!rateLimitResult.success) {
      return NextResponse.json({
        error: `Te veel registratiepogingen. Probeer het over ${rateLimitResult.resetIn} seconden opnieuw.`
      }, { status: 429 })
    }

    const body: RegisterBody = await request.json()
    const { email, password, fullName } = body

    if (!email || !password || !fullName) {
      return NextResponse.json({
        error: 'Alle velden zijn verplicht'
      }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({
        error: 'Wachtwoord moet minimaal 6 tekens bevatten'
      }, { status: 400 })
    }

    const supabase = createAdminClient()
    const normalizedEmail = email.toLowerCase()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single()

    if (existingUser) {
      return NextResponse.json({
        error: 'Dit emailadres is al geregistreerd'
      }, { status: 400 })
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const userId = uuidv4()
    const { error: insertError } = await supabase
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
      return NextResponse.json({
        error: 'Fout bij het aanmaken van het account'
      }, { status: 500 })
    }

    // Create JWT token and log user in
    const token = await createToken({
      userId,
      email: normalizedEmail,
      fullName,
      role: 'participant',
    })

    await setAuthCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: normalizedEmail,
        fullName,
        role: 'participant',
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({
      error: 'Er is een fout opgetreden bij het registreren'
    }, { status: 500 })
  }
}
