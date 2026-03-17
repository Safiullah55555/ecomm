// ─── Product Types ────────────────────────────────────────────────────────────
// These mirror your backend/database schema exactly.
// Use these same types in your API routes, Prisma models, or MongoDB schemas.

export type ProductBadge = 'new' | 'sale' | 'in_stock' | 'out_of_stock' | 'best_seller'

export interface ProductColor {
  label: string        // e.g. "Titanium Black"
  hex: string          // e.g. "#2C2C2A"
  inStock: boolean
}

export interface ProductSpec {
  label: string        // e.g. "200MP" | "ANC" | "USB-C"
}

export interface ProductImage {
  url: string
  alt: string
}

// ─── Core Product (matches DB row / API response) ─────────────────────────────
export interface Product {
  id: string
  slug: string                  // for Next.js routing: /products/[slug]
  brand: string
  name: string
  description?: string
  images: ProductImage[]
  price: number                 // current price in cents (e.g. 24900 = $249.00)
  originalPrice?: number        // if on sale, original price in cents
  currency: string              // e.g. "USD"
  rating: number                // 0–5
  reviewCount: number
  stockCount: number
  maxStock: number              // to calculate stock bar %
  badge?: ProductBadge
  colors?: ProductColor[]
  specs?: ProductSpec[]
  categoryId: string
  createdAt: string             // ISO date string from backend
  updatedAt: string
}

// ─── Card Component Props ──────────────────────────────────────────────────────
export interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string, colorLabel?: string) => Promise<void>
  onToggleWishlist?: (productId: string) => Promise<void>
  isWishlisted?: boolean
  priority?: boolean            // Next.js Image priority (above fold = true)
}

// ─── API Response Shapes ───────────────────────────────────────────────────────
export interface ApiProductsResponse {
  data: Product[]
  total: number
  page: number
  perPage: number
}

export interface ApiProductResponse {
  data: Product
}