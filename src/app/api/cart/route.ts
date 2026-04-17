import { NextRequest, NextResponse } from "next/server"
import { getCartAction, addToCartAction } from "@/actions/cart.actions"

// GET /api/cart
export async function GET() {
  try {
    const result = await getCartAction()
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.cartItems, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "internal server error, in get cart" }, { status: 500 })
  }
}

// POST /api/cart
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = await addToCartAction(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.cartItem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "internal server error, in add to cart" }, { status: 500 })
  }
}