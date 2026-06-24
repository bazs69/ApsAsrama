/**
 * Password Policy
 *
 * Centralized password validation rules.
 * Single source of truth for password requirements across the application.
 */

export interface PasswordRequirement {
  /** Unique key for this requirement */
  key: string
  /** Human-readable description (Indonesian) */
  label: string
  /** Test function — returns true if password satisfies this rule */
  test: (password: string) => boolean
}

export interface PasswordValidationResult {
  /** Whether the password passes all rules */
  valid: boolean
  /** List of failed requirement labels */
  errors: string[]
}

// ─── Configuration ───────────────────────────────────────────────────────────

const CONFIG = {
  minLength: 8,
}

// ─── Rules ───────────────────────────────────────────────────────────────────

const REQUIREMENTS: PasswordRequirement[] = [
  {
    key: "minLength",
    label: `Minimal ${CONFIG.minLength} karakter`,
    test: (pw) => pw.length >= CONFIG.minLength,
  },
  {
    key: "uppercase",
    label: "Minimal 1 huruf besar (A-Z)",
    test: (pw) => /[A-Z]/.test(pw),
  },
  {
    key: "lowercase",
    label: "Minimal 1 huruf kecil (a-z)",
    test: (pw) => /[a-z]/.test(pw),
  },
  {
    key: "number",
    label: "Minimal 1 angka (0-9)",
    test: (pw) => /[0-9]/.test(pw),
  },
  {
    key: "special",
    label: "Minimal 1 karakter khusus (!@#$%^&*...)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
]

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Validate a password against all configured requirements.
 *
 * @param password - The plaintext password to validate
 * @returns Object with `valid` boolean and `errors` array of failed requirement labels
 *
 * @example
 * ```ts
 * const result = validatePassword("Weak")
 * // { valid: false, errors: ["Minimal 8 karakter", "Minimal 1 angka (0-9)", ...] }
 *
 * const result = validatePassword("Str0ng!Pass")
 * // { valid: true, errors: [] }
 * ```
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = []

  for (const req of REQUIREMENTS) {
    if (!req.test(password)) {
      errors.push(req.label)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Get the list of all password requirements.
 * Useful for displaying requirements in the UI.
 *
 * @returns Array of PasswordRequirement objects
 *
 * @example
 * ```tsx
 * const requirements = getPasswordRequirements()
 * return (
 *   <ul>
 *     {requirements.map(r => (
 *       <li key={r.key}>{r.label}</li>
 *     ))}
 *   </ul>
 * )
 * ```
 */
export function getPasswordRequirements(): PasswordRequirement[] {
  return REQUIREMENTS
}
