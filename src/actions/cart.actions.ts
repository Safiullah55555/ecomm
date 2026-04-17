"use server"

import { prisma } from "@/lib/prisma"
import { addToCartSchema, updateCartSchema, removeFromCartSchema } from "@/lib/validations/cart"
import { auth } from "@/auth"

// ── Get Cart ──────────────────────────────────────────────
export async function getCartAction() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            originalPrice: true,
            currency: true,
            stockCount: true,
            images: {
              where: { position: 0 },
              select: { url: true, alt: true },
              take: 1,
            },
            brand: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { addedAt: "desc" },
    })

    return { success: true, cartItems }

  } catch (error) {
    console.error("[getCartAction error]", error)
    return { success: false, error: "Failed to fetch cart" }
  }
}

// ── Add To Cart ───────────────────────────────────────────
export async function addToCartAction(input: {
  productId: string
  color?: string
  quantity?: number
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = addToCartSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { productId, color, quantity } = parsed.data

    // Check product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, stockCount: true, isActive: true },
    })

    if (!product || !product.isActive) {
      return { success: false, error: "Product not found" }
    }

    if (product.stockCount < 1) {
      return { success: false, error: "Product is out of stock" }
    }

    // Upsert — if same user+product+color exists, increase quantity
    const cartItem = await prisma.cartItem.upsert({
      where: {
        userId_productId_color: {
          userId: session.user.id,
          productId,
          color: color ?? "",
        },
      },
      update: {
        quantity: { increment: quantity ?? 1 },
      },
      create: {
        userId: session.user.id,
        productId,
        color: color ?? null,
        quantity: quantity ?? 1,
      },
    })

    return { success: true, cartItem }

  } catch (error) {
    console.error("[addToCartAction error]", error)
    return { success: false, error: "Failed to add to cart" }
  }
}

// ── Update Quantity ───────────────────────────────────────
export async function updateCartAction(input: {
  cartItemId: string
  quantity: number
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = updateCartSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { cartItemId, quantity } = parsed.data

    // Make sure this cart item belongs to this user
    const existing = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Cart item not found" }
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    })

    return { success: true, cartItem }

  } catch (error) {
    console.error("[updateCartAction error]", error)
    return { success: false, error: "Failed to update cart" }
  }
}

// ── Remove From Cart ──────────────────────────────────────
export async function removeFromCartAction(input: {
  cartItemId: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const parsed = removeFromCartSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    const { cartItemId } = parsed.data

    // Make sure this cart item belongs to this user
    const existing = await prisma.cartItem.findFirst({
      where: { id: cartItemId, userId: session.user.id },
    })

    if (!existing) {
      return { success: false, error: "Cart item not found" }
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    })

    return { success: true }

  } catch (error) {
    console.error("[removeFromCartAction error]", error)
    return { success: false, error: "Failed to remove from cart" }
  }
}