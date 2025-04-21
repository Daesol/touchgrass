/**
 * Email validation regex pattern
 */
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

/**
 * Password requirements
 */
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REQUIRES_NUMBER = true
const PASSWORD_REQUIRES_SPECIAL = true
const PASSWORD_REQUIRES_UPPERCASE = true
const PASSWORD_REQUIRES_LOWERCASE = true

/**
 * Validates an email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }

  return { valid: true }
}

/**
 * Validates a password
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password) {
    return { valid: false, error: 'Password is required' }
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long` }
  }

  if (PASSWORD_REQUIRES_NUMBER && !/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' }
  }

  if (PASSWORD_REQUIRES_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' }
  }

  if (PASSWORD_REQUIRES_UPPERCASE && !/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' }
  }

  if (PASSWORD_REQUIRES_LOWERCASE && !/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' }
  }

  return { valid: true }
}

/**
 * Validates password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmation: string): { valid: boolean; error?: string } {
  if (!confirmation) {
    return { valid: false, error: 'Please confirm your password' }
  }

  if (password !== confirmation) {
    return { valid: false, error: 'Passwords do not match' }
  }

  return { valid: true }
}

/**
 * Validates signup form data
 */
export function validateSignupForm(data: { email: string; password: string; confirmPassword: string }) {
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    return emailValidation
  }

  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.valid) {
    return passwordValidation
  }

  const confirmValidation = validatePasswordConfirmation(data.password, data.confirmPassword)
  if (!confirmValidation.valid) {
    return confirmValidation
  }

  return { valid: true }
}

/**
 * Validates login form data
 */
export function validateLoginForm(data: { email: string; password: string }) {
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.valid) {
    return emailValidation
  }

  if (!data.password) {
    return { valid: false, error: 'Password is required' }
  }

  return { valid: true }
} 