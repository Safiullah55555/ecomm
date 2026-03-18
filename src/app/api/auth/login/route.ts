import { NextRequest, NextResponse } from "next/server"
import { loginAction } from "@/actions/auth.actions"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await loginAction(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    return NextResponse.json(result.user, { status: 200 } )

  } catch (error) {
    return NextResponse.json({ error: "internal server error, in login" }, { status: 500 })
  }
}