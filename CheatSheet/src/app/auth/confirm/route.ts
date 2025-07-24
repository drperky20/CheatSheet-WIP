import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'email',
      token_hash,
    })

    if (!error && data?.user) {
      // User is now confirmed and logged in
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    if (error) {
      console.error('Email confirmation error:', error.message)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }
  }

  // Invalid or missing parameters
  return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent('Invalid confirmation link')}`)
}