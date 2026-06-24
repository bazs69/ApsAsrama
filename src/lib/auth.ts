import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare } from "bcrypt"
import prisma from "./prisma"
import * as rateLimiter from "./security/rateLimiter"
import { needsPermissionRefresh, refreshUserPermissions } from "./security/permissionSync"

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
          return null
        }

        // Rate limit check (fail-open)
        try {
          const rateLimitResult = rateLimiter.check(credentials.email)
          if (!rateLimitResult.allowed) {
            return null
          }
        } catch {
          // Fail-open: continue login if rate limiter errors
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
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
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          // Record failed login attempt (fail-open)
          try {
            rateLimiter.recordFailure(credentials.email)
          } catch {
            // Fail-open: silently ignore
          }
          return null
        }

        // Record successful login (fail-open)
        try {
          rateLimiter.recordSuccess(credentials.email)
        } catch {
          // Fail-open: silently ignore
        }

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
        token.lastPermissionSync = Date.now()
        return token
      }

      // ─── SUBSEQUENT REQUESTS: refresh permissions on updateAge cycle ───
      // Defensive: skip refresh if user id is unavailable
      if (!token.id) {
        return token
      }

      // Only query DB when lastPermissionSync indicates a refresh is due
      if (needsPermissionRefresh(token.lastPermissionSync as number | undefined)) {
        const result = await refreshUserPermissions(prisma, token.id as string)

        if (result) {
          // Refresh succeeded (or user deleted) — apply result
          token.role = result.role
          token.permissions = result.permissions
          token.satkerId = result.satkerId
          token.lastPermissionSync = result.lastPermissionSync
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
    maxAge: 60 * 60 * 8,     // 8 hours
    updateAge: 60 * 30,       // 30 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
}
