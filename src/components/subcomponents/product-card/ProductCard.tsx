'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ProductCardProps, ProductColor } from './api/types'
import { formatPrice, calcDiscount, calcStockPercent } from './api/utils'

// ─── Sub-components ────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} className="w-2.5 h-2.5" viewBox="0 0 12 12">
            <polygon
              points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9 3,11 3.5,7.5 1,5 4.5,4.5"
              fill={i < Math.floor(rating) ? '#BA7517' : '#D3D1C7'}
            />
          </svg>
        ))}
      </div>
      <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

function BadgePill({ badge }: { badge: string }) {
  const styles: Record<string, string> = {
    new: 'bg-blue-950 text-blue-200',
    sale: 'bg-red-950 text-red-200',
    in_stock: 'bg-green-950 text-green-300',
    out_of_stock: 'bg-neutral-800 text-neutral-400',
    best_seller: 'bg-amber-950 text-amber-300',
  }
  const labels: Record<string, string> = {
    new: 'New',
    sale: 'Sale',
    in_stock: 'In Stock',
    out_of_stock: 'Sold Out',
    best_seller: 'Best Seller',
  }
  return (
    <span
      className={`absolute top-3 left-3 z-10 text-[10px] font-mono font-medium uppercase tracking-widest px-2 py-1 rounded ${styles[badge] ?? 'bg-neutral-800 text-neutral-300'}`}
    >
      {labels[badge] ?? badge}
    </span>
  )
}

function WishlistButton({
  active,
  loading,
  onClick,
}: {
  active: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 transition-colors hover:border-neutral-400 dark:hover:border-neutral-500 disabled:opacity-50"
    >
      <svg
        className="w-3.5 h-3.5 transition-colors"
        viewBox="0 0 24 24"
        fill={active ? '#E24B4A' : 'none'}
        stroke={active ? '#E24B4A' : 'currentColor'}
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

function StockBar({ stock, max }: { stock: number; max: number }) {
  const pct = calcStockPercent(stock, max)
  const isLow = pct < 25

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
        <span>Stock</span>
        <span className={isLow ? 'text-red-400' : ''}>
          {stock} left{isLow ? ' — low!' : ''}
        </span>
      </div>
      <div className="h-[3px] w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isLow ? 'bg-red-400' : 'bg-neutral-900 dark:bg-neutral-100'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ColorSelector({
  colors,
  selected,
  onChange,
}: {
  colors: ProductColor[]
  selected: string
  onChange: (label: string) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((c) => (
        <button
          key={c.label}
          onClick={() => onChange(c.label)}
          disabled={!c.inStock}
          title={c.label}
          aria-label={c.label}
          className={`w-3.5 h-3.5 rounded-full border transition-transform duration-150 disabled:opacity-30 ${
            selected === c.label
              ? 'scale-125 border-neutral-900 dark:border-neutral-100'
              : 'border-transparent hover:scale-110'
          }`}
          style={{ backgroundColor: c.hex }}
        />
      ))}
      <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 ml-1">
        {selected}
      </span>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  priority = false,
}: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState<string>(
    product.colors?.[0]?.label ?? ''
  )
  const [cartState, setCartState] = useState<'idle' | 'loading' | 'added'>('idle')
  const [wishState, setWishState] = useState<'idle' | 'loading'>('idle')
  const [wishlisted, setWishlisted] = useState(isWishlisted)

  const discount = product.originalPrice
    ? calcDiscount(product.price, product.originalPrice)
    : null

  const handleAddToCart = useCallback(async () => {
    if (!onAddToCart || cartState !== 'idle') return
    setCartState('loading')
    try {
      await onAddToCart(product.id, selectedColor || undefined)
      setCartState('added')
      setTimeout(() => setCartState('idle'), 1800)
    } catch {
      setCartState('idle')
    }
  }, [onAddToCart, cartState, product.id, selectedColor])

  const handleWishlist = useCallback(async () => {
    if (!onToggleWishlist || wishState !== 'idle') return
    setWishState('loading')
    try {
      await onToggleWishlist(product.id)
      setWishlisted((prev) => !prev)
    } finally {
      setWishState('idle')
    }
  }, [onToggleWishlist, wishState, product.id])

  const primaryImage = product.images[0]

  return (
    <article className="group relative flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-neutral-300 dark:hover:border-neutral-700">

      {/* ── Image Zone ── */}
      <div className="relative bg-neutral-50 dark:bg-neutral-800 aspect-[4/3] overflow-hidden">
        {primaryImage && (
          <Link href={`/products/${product.slug}`} tabIndex={-1} aria-hidden="true">
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={priority}
              className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.04]"
            />
          </Link>
        )}

        {/* Scrim on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors duration-200 pointer-events-none" />

        {/* Badge */}
        {product.badge && <BadgePill badge={product.badge} />}

        {/* Wishlist */}
        <WishlistButton
          active={wishlisted}
          loading={wishState === 'loading'}
          onClick={handleWishlist}
        />

        {/* Quick actions — slide up on hover */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 z-10">
          <button
            onClick={handleAddToCart}
            disabled={cartState !== 'idle' || product.stockCount === 0}
            className="flex-1 h-8 text-[12px] font-medium rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {cartState === 'loading' ? '...' : cartState === 'added' ? 'Added!' : 'Quick add'}
          </button>
          <Link
            href={`/products/${product.slug}`}
            className="flex-1 h-8 text-[12px] font-medium rounded-md bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 transition-colors flex items-center justify-center"
          >
            View ↗
          </Link>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">

        {/* Brand + Name */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">
            {product.brand}
          </p>
          <Link
            href={`/products/${product.slug}`}
            className="text-[13.5px] font-medium text-neutral-900 dark:text-neutral-100 leading-snug line-clamp-2 hover:underline underline-offset-2"
          >
            {product.name}
          </Link>
        </div>

        {/* Rating */}
        <StarRating rating={product.rating} />

        {/* Color Selector */}
        {product.colors && product.colors.length > 0 && (
          <ColorSelector
            colors={product.colors}
            selected={selectedColor}
            onChange={setSelectedColor}
          />
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-mono font-medium text-neutral-900 dark:text-neutral-100">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.originalPrice && (
            <>
              <span className="text-[12px] font-mono text-neutral-400 line-through">
                {formatPrice(product.originalPrice, product.currency)}
              </span>
              <span className="text-[11px] font-mono text-green-600 dark:text-green-400">
                -{discount}%
              </span>
            </>
          )}
        </div>

        {/* Specs */}
        {product.specs && product.specs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.specs.map((s) => (
              <span
                key={s.label}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800"
              >
                {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Stock Bar */}
        <StockBar stock={product.stockCount} max={product.maxStock} />

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={cartState !== 'idle' || product.stockCount === 0}
          className={`mt-auto w-full h-9 rounded-lg text-[13px] font-medium tracking-wide transition-all duration-150
            ${cartState === 'added'
              ? 'bg-green-700 text-green-100'
              : product.stockCount === 0
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-85 active:scale-[0.98]'
            } disabled:opacity-60`}
        >
          {product.stockCount === 0
            ? 'Out of Stock'
            : cartState === 'loading'
            ? 'Adding...'
            : cartState === 'added'
            ? 'Added to cart!'
            : 'Add to cart'}
        </button>
      </div>
    </article>
  )
}