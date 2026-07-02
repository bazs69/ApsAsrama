import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import prisma from "./prisma"
import { RateLimiter, RATE_LIMITS, MemoryStore, RateLimitResult } from "./security/rateLimit"

const loginStore = new MemoryStore()
const loginLimiter = new RateLimiter(loginStore, RATE_LIMITS.LOGIN, "login")
import { needsPermissionRefresh, refreshUserPermissions, PERMISSION_REFRESH_INTERVAL_MS } from "./security/permissionSync"
import { logAuditEvent } from "./security/auditLogger"
import { AuditAction } from "./security/auditActions"
import { sessionInvalidationStore } from "./auth/sessionInvalidationStore"

// ─── Session Timing Constants ───
const SESSION_MAX_AGE = 60 * 60 * 8               // 8 hours (seconds)
const SESSION_UPDATE_AGE = PERMISSION_REFRESH_INTERVAL_MS / 1000 // 30 minutes (seconds)

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          // Missing credentials
          await logAuditEvent({
            action: AuditAction.LOGIN_FAILURE,
            resource: "auth",
            metadata: { reason: "missing_credentials" },
          })
          return null
        }

        // Rate limit check
        let rateLimitResult: RateLimitResult | null = null
        try {
          rateLimitResult = await loginLimiter.consume(credentials.email)
        } catch {
          // Fail-open: continue login if rate limiter errors
        }

        if (rateLimitResult && !rateLimitResult.success) {
          try {
            await logAuditEvent({
              action: AuditAction.LOGIN_RATE_LIMIT,
              actorId: null,
              resource: "auth",
              metadata: {
                email: credentials.email,
                identifier: credentials.email,
                remaining: rateLimitResult.remaining,
                resetTime: rateLimitResult.resetTime
              },
            })
          } catch {
            // Fail-open: logging must never interfere with login block
          }
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        })

        if (!user) {
          await logAuditEvent({
            action: AuditAction.LOGIN_FAILURE,
            resource: "auth",
            metadata: { email: credentials.email },
          })
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          // Failed authentication attempt naturally consumed the limiter already

          await logAuditEvent({
            action: AuditAction.LOGIN_FAILURE,
            resource: "auth",
            metadata: { email: credentials.email },
          })
          return null
        }

        // Record successful login - reset the limiter
        try {
          await loginLimiter.reset(credentials.email)
        } catch {
          // Fail-open: silently ignore
        }

        await logAuditEvent({
          action: AuditAction.LOGIN_SUCCESS,
          resource: "auth",
          actorId: user.id,
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role?.name || "GUEST",
          permissions: user.role?.permissions.map(rp => rp.permission.code) || [],
          satkerId: user.satkerId,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // ─── LOGIN: user object available from authorize() ───
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
        token.id = user.id
        token.satkerId = (user as { satkerId?: string | null }).satkerId
        token.permissionRefreshedAt = Date.now()
        return token
      }

      // ─── SUBSEQUENT REQUESTS: refresh permissions on updateAge cycle ───
      // Defensive: skip refresh if user id is unavailable
      if (!token.id) {
        return token
      }

      // ─── Session Invalidation Check ───
      const invalidatedAt = await sessionInvalidationStore.getInvalidatedAt(token.id as string)
      if (invalidatedAt && token.iat && (token.iat as number) * 1000 < invalidatedAt) {
        return {
          ...token,
          role: "",
          permissions: [],
          satkerId: null,
          permissionRefreshedAt: Date.now()
        }
      }

      // Only query DB when permissionRefreshedAt indicates a refresh is due
      if (needsPermissionRefresh(token.permissionRefreshedAt as number | undefined)) {
        const result = await refreshUserPermissions(prisma, token.id as string)

        if (result) {
          // Refresh succeeded (or user deleted) — apply result
          token.role = result.role
          token.permissions = result.permissions
          token.satkerId = result.satkerId
          token.permissionRefreshedAt = result.permissionRefreshedAt
        }
        // If result is null (DB failure), keep existing token data (fail-open)
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.permissions = (token.permissions as string[]) || []
        session.user.id = token.id as string
        session.user.satkerId = token.satkerId as string | undefined
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  events: {
    async signOut() {
      // Note: NextAuth v4 signOut event does not provide token/session,
      // so actorId is unavailable. The event is still recorded for audit.
      await logAuditEvent({
        action: AuditAction.LOGOUT,
        resource: "auth",
      })
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
