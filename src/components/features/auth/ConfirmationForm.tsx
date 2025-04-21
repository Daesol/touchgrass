'use client'

import { useSearchParams } from 'next/navigation'
import { useFormState, useFormStatus } from 'react-dom'
import { resendConfirmationEmail } from "@/actions/authActions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Resend Confirmation Email
    </Button>
  )
}

export function ConfirmationForm() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const initialState = { 
      message: '', 
      errors: {} as Record<string, string[]>,
      fieldValues: { email } 
  };
  const [state, formAction] = useFormState(resendConfirmationEmail, initialState)

  useEffect(() => {
    if (state?.message) { 
      if (state.message.includes('successfully')) {
         toast.success(state.message);
      } else if (state.message !== 'Validation failed') {
         toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Check Your Email</h1>
        <p className="mt-2 text-muted-foreground">
          We've sent a confirmation link to <strong>{email || 'your email address'}</strong>. 
          Please click the link to activate your account.
        </p>
      </div>
      
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        
        <SubmitButton />
        
        {state?.message && state.message !== 'Validation failed' && !state.message.includes('successfully') && (
            <p className="mt-2 text-xs text-red-600 text-center">{state.message}</p>
        )}
        {state?.message && state.message.includes('successfully') && (
            <p className="mt-2 text-xs text-green-600 text-center">{state.message}</p>
        )}
      </form>
      
      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to Login
        </Link>
      </div>
    </div>
  )
} 