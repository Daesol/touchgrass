'use client'

interface AuthErrorDisplayProps {
  error: string | null
  onResendConfirmation?: () => Promise<void>
  className?: string
}

export function AuthErrorDisplay({
  error,
  onResendConfirmation,
  className = '',
}: AuthErrorDisplayProps) {
  if (!error) return null
  
  const isVerificationError = error.toLowerCase().includes('not been verified') ||
    error.toLowerCase().includes('not confirmed')
  
  return (
    <div className={`p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200 ${className}`}>
      {error}
      {isVerificationError && onResendConfirmation && (
        <button
          onClick={onResendConfirmation}
          className="block mt-2 text-blue-600 hover:underline"
        >
          Resend verification email
        </button>
      )}
    </div>
  )
} 