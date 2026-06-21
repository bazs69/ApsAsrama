import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      permissions: string[]
      satkerId?: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    permissions: string[]
    satkerId?: string | null
  }
}
