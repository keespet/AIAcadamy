import { randomBytes, createHash } from 'crypto'

/**
 * Generates a cryptographically secure random token
 * Uses 32 bytes = 256 bits of entropy, encoded as base64url
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Hashes a token for secure storage in the database
 * We store the hash, not the raw token, for security
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Calculates token expiration date
 */
export function getTokenExpiry(hours: number = 72): Date {
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + hours)
  return expiry
}

/**
 * Validates token format (basic check)
 */
export function isValidTokenFormat(token: string): boolean {
  // Base64url tokens are alphanumeric with - and _
  // 32 bytes = 43 characters in base64url (without padding)
  return /^[A-Za-z0-9_-]{40,50}$/.test(token)
}
