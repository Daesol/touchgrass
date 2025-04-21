'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signup } from "@/actions/authActions" // Import the server action
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from 'lucide-react' // Import Loader2
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { GoogleAuthButton } from "./GoogleAuthButton"; // Import Google Button

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Sign Up
    </Button>
  )
}

export function SignupForm() {
  const initialState = null;
  const [state, formAction] = useFormState(signup, initialState)

  useEffect(() => {
    if (state?.message && !state.errors) { // Show success/error messages (non-validation)
      if (state.message.includes('Signup successful')) {
        toast.success(state.message);
      } else if (state.message !== 'Validation failed') {
         toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
            <h1 className="text-3xl font-bold">Sign Up</h1>
            <p className="text-muted-foreground">Enter your information to create an account</p>
        </div>
        <form action={formAction} className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  required 
                  defaultValue={state?.fieldValues?.email || ''}
                />
                 {state?.errors?.email && (
                  <p className="text-xs text-red-600">{state.errors.email[0]}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6} 
                />
                 {state?.errors?.password && (
                  <p className="text-xs text-red-600">{state.errors.password[0]}</p>
                )}
              </div>
            {state?.message && !state.errors && state.message !== 'Validation failed' && !state.message.includes('Signup successful') && (
                    <p className="text-xs text-red-600 text-center">{state.message}</p>
                )}
            {state?.message && state.message.includes('Signup successful') && (
                    <p className="text-xs text-green-600 text-center">{state.message}</p>
                )}
          <SubmitButton />
        </form>
        
        {/* Separator */}
         <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>

        {/* Google Button */}
        <GoogleAuthButton />

         {/* Link to Log in */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
    </div>
  )
} 