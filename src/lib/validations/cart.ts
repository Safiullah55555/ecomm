import { z } from "zod"

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  color: z.string().optional(),
  quantity: z.number().int().min(1).max(100).default(1),
})

export const updateCartSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.number().int().min(1).max(100),
})

export const removeFromCartSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>
export type UpdateCartInput = z.infer<typeof updateCartSchema>
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>