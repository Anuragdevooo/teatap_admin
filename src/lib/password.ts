/**
 * Readable-but-strong password suggestion.
 *
 * Ambiguous glyphs (0/O, 1/l/I) are excluded on purpose: an admin setting a
 * vendor's password usually reads it down a phone line, so "unmistakable when
 * spoken" beats "maximum entropy per character" at this length.
 */
export function generatePassword(length = 12): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

export type PasswordStrength = 'weak' | 'fair' | 'strong';

/** Coarse strength banding — length first, because at this length it dominates. */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (password.length >= 12 && classes >= 3) return 'strong';
  if (password.length >= 10 && classes >= 2) return 'fair';
  return classes >= 3 ? 'fair' : 'weak';
}

export const STRENGTH_LABEL: Record<PasswordStrength, string> = {
  weak: 'Too weak',
  fair: 'Acceptable',
  strong: 'Strong',
};
