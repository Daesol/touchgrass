import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env.local
const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Found (not showing for security)' : 'Not found')

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Define a base URL - defaults to localhost for this test script
// In a real app, this should come from environment variables (e.g., VERCEL_URL, NEXT_PUBLIC_SITE_URL)
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const REDIRECT_URL = `${BASE_URL}/auth/callback`

async function checkAuthConfig() {
  console.log('Checking Supabase AUTH configuration...')
  
  try {
    // Test for a non-existent user to check the error message
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'testpassword123'
    })
    
    if (signInError) {
      console.log('Expected sign-in error (this is normal):', signInError.message)
      console.log('Auth service is responding correctly')
    } else {
      console.warn('Warning: Signed in as non-existent user? This is unexpected.')
    }
    
    // Test sign-up functionality (without actually creating a user)
    console.log('\nTesting sign-up configuration...')
    
    // Create a disposable email for testing
    const testEmail = `test${Date.now()}@example.com`
    const testPassword = 'StrongPassword123!'
    
    // Check if we can initiate the sign-up process
    const { error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: REDIRECT_URL, // Use dynamic redirect URL
      }
    })
    
    if (signUpError) {
      console.log('Sign-up process error:', signUpError.message)
      
      if (signUpError.message.includes('Email confirmation') || 
          signUpError.message.includes('email') ||
          signUpError.message.includes('confirm')) {
        console.log('Email confirmation appears to be enabled (this is good for security)')
      } else {
        console.warn('Warning: Unexpected sign-up error. Auth settings might need verification.')
      }
    } else {
      console.log('Sign-up process initiated successfully')
      console.log('Note: A confirmation email would be sent to a real user')
    }
    
    // Check for redirect URL configuration
    console.log('\nChecking redirect URL configuration...')
    
    try {
      const { data, error: urlError } = await supabase.auth.resetPasswordForEmail(
        'test@example.com',
        { redirectTo: REDIRECT_URL } // Use dynamic redirect URL
      )
      
      if (urlError) {
        console.log('Password reset request error:', urlError.message)
        
        if (urlError.message.includes('redirect') || urlError.message.includes('URL')) {
          console.warn('Warning: There might be an issue with the redirect URL configuration')
        }
      } else {
        console.log('Password reset request initiated successfully')
        console.log('This suggests redirect URLs are configured correctly')
      }
    } catch (urlError) {
      console.error('Error testing redirect URL:', urlError)
    }
    
    // Check the OAuth configuration by attempting to generate a sign-in URL
    console.log('\nChecking OAuth providers...')
    
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: REDIRECT_URL, // Use dynamic redirect URL
          skipBrowserRedirect: true
        }
      })
      
      if (oauthError) {
        console.log('OAuth configuration error:', oauthError.message)
        
        if (oauthError.message.includes('not supported') || oauthError.message.includes('not configured')) {
          console.warn('Warning: Google OAuth provider may not be properly configured')
        }
      } else if (data && data.url) {
        console.log('OAuth URL generated successfully for Google provider')
        console.log('This suggests the Google OAuth provider is configured')
      } else {
        console.log('OAuth test result inconclusive')
      }
    } catch (oauthError) {
      console.error('Error testing OAuth configuration:', oauthError)
    }
    
    console.log('\nVerifying email confirmation requirement...')
    const emailConfirmRequired = signUpError ? 
      (signUpError.message.includes('confirm') || signUpError.message.includes('verify')) :
      true // If no error, assume it's configured properly
      
    if (emailConfirmRequired) {
      console.log('✅ Email confirmation appears to be enabled')
    } else {
      console.warn('⚠️ Email confirmation might not be enabled, which is a security risk')
    }
    
    console.log('\nRecommendations:')
    console.log(`1. Ensure your Site URL in Supabase Auth settings matches your deployment URL (e.g., ${process.env.VERCEL_URL || 'https://your-app.vercel.app'})`)
    console.log(`2. Add your local development URL (e.g., ${BASE_URL}) to the Redirect URLs list in Supabase Auth settings.`)
    console.log('3. Verify that email confirmation is enabled for security')
    console.log('4. Check that required OAuth providers (like Google) are enabled and correctly configured in Supabase Auth settings.')
    
    console.log('\nAuth configuration check completed')
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkAuthConfig() 