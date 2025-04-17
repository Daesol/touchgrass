import { NextRequest, NextResponse } from 'next/server'

// This is a special endpoint to forcefully clear all cookies related to Supabase auth
export async function GET(request: NextRequest) {
  console.log("Clearing all cookies for complete logout")
  
  const response = NextResponse.json({ success: true, message: "All auth cookies cleared" })
  
  // Find and clear all potential Supabase-related cookies
  const allCookies = request.cookies.getAll()
  
  for (const cookie of allCookies) {
    if (cookie.name.includes('supabase') || 
        cookie.name.includes('auth') || 
        cookie.name.includes('sb-') ||
        cookie.name.includes('token')) {
      
      console.log(`Clearing cookie: ${cookie.name}`)
      
      // Clear the cookie in multiple ways to ensure it's removed
      // 1. With path=/
      response.cookies.set({
        name: cookie.name,
        value: '',
        expires: new Date(0),
        maxAge: 0,
        path: '/',
      })
      
      // 2. With no path
      response.cookies.set({
        name: cookie.name,
        value: '',
        expires: new Date(0),
        maxAge: 0,
      })
      
      // 3. With exact domain
      response.cookies.set({
        name: cookie.name,
        value: '',
        expires: new Date(0),
        maxAge: 0,
        path: '/',
        domain: request.nextUrl.hostname,
      })
    }
  }
  
  // Also clear redirect count cookie
  response.cookies.set({
    name: 'redirect-count',
    value: '0',
    path: '/',
  })
  
  // Add cache control headers to prevent caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

export async function POST() {
  return GET();
} 