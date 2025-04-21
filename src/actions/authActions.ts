'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { AuthError } from '@supabase/supabase-js'

// Define Zod schemas for validation
const emailSchema = z.string().email({ message: 'Invalid email address' });
const passwordSchema = z.string().min(6, { message: 'Password must be at least 6 characters' });

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Schema for resend confirmation
const resendSchema = z.object({
  email: emailSchema,
});

// Helper to handle form state and validation errors
type FormState = { message: string; errors?: Record<string, string[]>; fieldValues?: Record<string, string> } | null;

export async function login(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = loginSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      fieldValues: rawFormData as Record<string, string>,
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error.message);
    let userMessage = 'Could not authenticate user. Please check your credentials.';
    if (error.message.includes('Email not confirmed')) {
        userMessage = 'Please confirm your email address first.';
    } else if (error.message.includes('Invalid login credentials')) {
        userMessage = 'Invalid email or password.';
    }
    return {
      message: userMessage,
      fieldValues: { email },
    };
  }

  // Revalidate relevant paths and redirect
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard', 'page');
  return redirect('/dashboard');
}

export async function signup(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = signupSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      fieldValues: rawFormData as Record<string, string>,
    };
  }

  const { email, password } = validatedFields.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/confirm`,
    },
  });

  if (error) {
    console.error('Signup error:', error.message);
    if (error instanceof AuthError && error.message.includes('User already registered')) {
      return {
        message: 'This email is already registered. Try logging in.',
        fieldValues: { email },
      };
    } 
    return {
      message: 'Could not create user. Please try again later.',
      fieldValues: { email },
    };
  }

  // Revalidate relevant paths and redirect
  revalidatePath('/', 'layout');
  return {
    message: 'Signup successful! Please check your email to confirm your account.',
    fieldValues: { email },
  };
}

export async function resendConfirmationEmail(prevState: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const rawFormData = Object.fromEntries(formData.entries());

  const validatedFields = resendSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: 'Validation failed',
      errors: validatedFields.error.flatten().fieldErrors,
      fieldValues: rawFormData as Record<string, string>,
    };
  }

  const { email } = validatedFields.data;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });

  if (error) {
    console.error('Resend confirmation error:', error.message);
    return {
      message: `Failed to resend confirmation: ${error.message}`,
      fieldValues: { email },
    };
  }

  return {
    message: 'Confirmation email resent successfully. Please check your inbox.',
    fieldValues: { email },
  };
}

// Note: Google Sign in and Sign out actions should use the *CLIENT* component client
// as they are typically initiated by user interaction in the browser.
// We will fix the components that use these next.

export async function signInWithGoogle() {
  console.error("signInWithGoogle Server Action should not be called directly. Use client-side logic.");
  return { error: "Invalid action call." };
}

export async function signOut() {
  console.error("signOut Server Action should not be called directly. Use client-side logic.");
  return { error: "Invalid action call." };
} 