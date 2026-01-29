import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get the user info
      const { data: { user } } = await supabase.auth.getUser()

      if (user?.email) {
        // Link the user_id to any pending invite with this email
        try {
          const supabaseAdmin = createAdminClient()

          // Find pending invite by email and update with user_id
          const { error: updateError } = await supabaseAdmin
            .from('organization_members')
            .update({
              user_id: user.id,
              status: 'active',
              joined_at: new Date().toISOString()
            } as never)
            .eq('email', user.email.toLowerCase())
            .is('user_id', null)

          if (updateError) {
            console.error('Error linking user to organization:', updateError)
          }
        } catch (e) {
          console.error('Error in auth callback:', e)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
