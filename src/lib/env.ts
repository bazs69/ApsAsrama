/**
 * Environment Variables Abstraction
 * 
 * Provides a centralized place for accessing environment variables.
 * In Production V2, this can be enhanced with Zod schema validation to ensure
 * all required environment variables are present at startup.
 */

export const env = {
  get DATABASE_URL(): string {
    const val = process.env.DATABASE_URL
    if (!val) throw new Error("DATABASE_URL is not set")
    return val
  },

  get NEXTAUTH_SECRET(): string {
    const val = process.env.NEXTAUTH_SECRET
    if (!val) throw new Error("NEXTAUTH_SECRET is not set")
    return val
  },

  get NEXTAUTH_URL(): string {
    const val = process.env.NEXTAUTH_URL
    if (!val) throw new Error("NEXTAUTH_URL is not set")
    return val
  },

  get NODE_ENV(): "development" | "production" | "test" {
    return (process.env.NODE_ENV as "development" | "production" | "test") || "development"
  }
}
