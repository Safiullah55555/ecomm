import { NextRequest, NextResponse } from "next/server"
import { updateCartAction, removeFromCartAction } from "@/actions/cart.actions"

// PATCH /api/cart/:cartItemId
export async function PATCH(req: NextRequest, { params }: { params: { cartItemId: string } }) {
  try {
    const body = await req.json()
    const result = await updateCartAction({ 
      cartItemId: params.cartItemId, 
      quantity: body.quantity 
    })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result.cartItem, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "internal server error, in update cart" }, { status: 500 })
  }
}

// DELETE /api/cart/:cartItemId
export async function DELETE(req: NextRequest, { params }: { params: { cartItemId: string } }) {
  try {
    const result = await removeFromCartAction({ cartItemId: params.cartItemId })
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json({ message: "Item removed" }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: "internal server error, in remove from cart" }, { status: 500 })
  }
}