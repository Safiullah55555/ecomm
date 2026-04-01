import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  const { pathname } = req.nextUrl
  const isLoggedIn = !!token
  const role = token?.role as string | undefined

  if (pathname.startsWith("/admindashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (pathname.startsWith("/userdashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admindashboard", "/userdashboard"],
}