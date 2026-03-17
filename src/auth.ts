import { getServerSession } from "next-auth/next"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Google from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"
import type { JWT } from "next-auth/jwt"

// v4 Session type declaration
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}



declare module "next-auth/jwt" {
  interface JWT {
    id?: string
  }
}

const authConfig: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user.id) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
}

// Export auth() function for server components like page.tsx
export async function auth() {
  return await getServerSession(authConfig)
}

// Export signIn/signOut for forms/actions
export { signIn, signOut } from "next-auth/react"

// Handlers for API route
import NextAuth from "next-auth"

export const handlers = NextAuth(authConfig)

