// ─── Server Component — fetches products on the server ────────────────────────
// This is a Next.js 14+ Server Component (no 'use client').
// Data is fetched at request time and rendered on the server.

import { Suspense } from 'react'
import { Product } from './api/types'
import ProductCard from './ProductCard'
import ProductCardSkeleton from './api/ProductCardSkeleton'
import ProductGridClient from './api/ProductGridClient'

interface ProductGridProps {
  categoryId?: string
  page?: number
  perPage?: number
}

// ── Server-side data fetcher ───────────────────────────────────────────────────
async function getProducts(params: ProductGridProps): Promise<Product[]> {
  const { categoryId, page = 1, perPage = 12 } = params

  const url = new URL('/api/products', 'http://localhost:3000')
  if (categoryId) url.searchParams.set('categoryId', categoryId)
  url.searchParams.set('page', String(page))
  url.searchParams.set('perPage', String(perPage))

  const res = await fetch(url.toString(), {
    // Cache for 60s, revalidate in background (ISR-style)
    next: { revalidate: 60 },
    headers: {
      'Content-Type': 'application/json',
      // Add auth if needed:
      // Authorization: `Bearer ${process.env.API_SECRET}`,
    },
  })

  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`)

  const json = await res.json()
  return json.data as Product[]
}

// ── Grid Layout ────────────────────────────────────────────────────────────────
export default async function ProductGrid(props: ProductGridProps) {
  const products = await getProducts(props)

  return (
    <ProductGridClient products={products} />
  )
}

// ── Skeleton fallback for Suspense ─────────────────────────────────────────────
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Usage in a page:
// <Suspense fallback={<ProductGridSkeleton />}>
//   <ProductGrid categoryId="electronics" page={1} />
// </Suspense>