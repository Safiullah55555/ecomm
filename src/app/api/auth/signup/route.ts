import { NextRequest, NextResponse } from "next/server"
import { signUpAction } from "@/actions/auth.actions"

export async function POST(req: NextRequest) {

  try {
    const body = await req.json()
    const result = await signUpAction(body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.user, { status: 201 })

  } catch (error) {
    return NextResponse.json({ error: "internal server error, in signup" }, { status: 500 })
  }
  

}