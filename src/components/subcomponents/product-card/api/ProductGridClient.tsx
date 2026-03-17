'use client'

// ─── Client Component — handles cart & wishlist mutations ─────────────────────
// Receives pre-fetched products from the Server Component (ProductGrid.tsx).
// All user interactions (add to cart, wishlist) are handled here.

import { useState, useCallback } from 'react'
import ProductCard from '../ProductCard'
import { Product } from './types'

interface ProductGridClientProps {
  products: Product[]
}

export default function ProductGridClient({ products }: ProductGridClientProps) {
  // Track wishlist state client-side (ideally hydrate from session/cookie)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())

  // ── Add to cart ─────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(async (productId: string, colorLabel?: string) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, color: colorLabel, quantity: 1 }),
    })
    if (!res.ok) throw new Error('Failed to add to cart')
    // Optionally: revalidate cart count in header, update zustand/context store
  }, [])

  // ── Wishlist toggle ─────────────────────────────────────────────────────────
  const handleToggleWishlist = useCallback(async (productId: string) => {
    const isCurrentlyWished = wishlistIds.has(productId)

    const res = await fetch('/api/wishlist', {
      method: isCurrentlyWished ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    })
    if (!res.ok) throw new Error('Wishlist update failed')

    setWishlistIds((prev) => {
      const next = new Set(prev)
      isCurrentlyWished ? next.delete(productId) : next.add(productId)
      return next
    })
  }, [wishlistIds])

  if (products.length === 0) {
    return (
      <p className="text-sm text-neutral-400 dark:text-neutral-500 text-center py-12">
        No products found.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          isWishlisted={wishlistIds.has(product.id)}
          priority={i < 3}
        />
      ))}
    </div>
  )
}