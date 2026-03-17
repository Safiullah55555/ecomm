import { NextRequest, NextResponse } from 'next/server'

// Mock product data
const mockProducts = [
  {
    id: '1',
    slug: 'iphone-15-pro',
    brand: 'Apple',
    name: 'iPhone 15 Pro',
    description: 'Latest flagship smartphone with A17 Pro chip',
    images: [
      { url: 'https://via.placeholder.com/400x400?text=iPhone+15+Pro', alt: 'iPhone 15 Pro' },
    ],
    price: 99900, // $999.00
    originalPrice: 109900,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 2450,
    stockCount: 35,
    maxStock: 100,
    badge: 'best_seller',
    colors: [
      { label: 'Titanium Black', hex: '#2C2C2A', inStock: true },
      { label: 'Titanium White', hex: '#F5F5F5', inStock: true },
      { label: 'Titanium Blue', hex: '#1B3A6B', inStock: false },
    ],
    specs: [
      { label: '200MP Camera' },
      { label: 'A17 Pro Chip' },
      { label: '1TB Storage' },
    ],
    categoryId: 'electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'samsung-galaxy-s24',
    brand: 'Samsung',
    name: 'Samsung Galaxy S24',
    description: 'Premium Android smartphone with Snapdragon processor',
    images: [
      { url: 'https://via.placeholder.com/400x400?text=Galaxy+S24', alt: 'Galaxy S24' },
    ],
    price: 89900,
    currency: 'USD',
    rating: 4.6,
    reviewCount: 1850,
    stockCount: 42,
    maxStock: 100,
    badge: 'in_stock',
    colors: [
      { label: 'Phantom Black', hex: '#000000', inStock: true },
      { label: 'Gray', hex: '#808080', inStock: true },
    ],
    specs: [
      { label: '50MP Camera' },
      { label: 'Snapdragon 8 Gen 3' },
    ],
    categoryId: 'electronics',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'sony-wh1000-headphones',
    brand: 'Sony',
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise canceling headphones',
    images: [
      { url: 'https://via.placeholder.com/400x400?text=Sony+Headphones', alt: 'Sony Headphones' },
    ],
    price: 39999,
    originalPrice: 44999,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 3200,
    stockCount: 58,
    maxStock: 100,
    badge: 'sale',
    colors: [
      { label: 'Black', hex: '#000000', inStock: true },
      { label: 'Silver', hex: '#C0C0C0', inStock: true },
    ],
    specs: [
      { label: 'ANC' },
      { label: '30-hour battery' },
      { label: 'Bluetooth 5.3' },
    ],
    categoryId: 'audio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'ipad-air',
    brand: 'Apple',
    name: 'iPad Air 6th Gen',
    description: 'Powerful tablet for productivity and creativity',
    images: [
      { url: 'https://via.placeholder.com/400x400?text=iPad+Air', alt: 'iPad Air' },
    ],
    price: 59900,
    currency: 'USD',
    rating: 4.7,
    reviewCount: 980,
    stockCount: 28,
    maxstock: 80,
    badge: 'new',
    colors: [
      { label: 'Space Gray', hex: '#545454', inStock: true },
      { label: 'Starlight', hex: '#FAFAF8', inStock: true },
    ],
    specs: [
      { label: 'M2 Chip' },
      { label: '12.9" Display' },
    ],
    categoryId: 'tablets',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    slug: 'airpods-pro',
    brand: 'Apple',
    name: 'AirPods Pro 2nd Gen',
    description: 'Premium wireless earbuds with adaptive audio',
    images: [
      { url: 'https://via.placeholder.com/400x400?text=AirPods+Pro', alt: 'AirPods Pro' },
    ],
    price: 24900,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 5100,
    stockCount: 72,
    maxStock: 150,
    colors: [
      { label: 'White', hex: '#FFFFFF', inStock: true },
    ],
    specs: [
      { label: 'ANC' },
      { label: '6-hour battery' },
    ],
    categoryId: 'audio',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '6',
    slug: 'macbook-pro-m3',
    brand: 'Apple',
    name: 'MacBook Pro 16" M3 Max',
    description: 'Powerful laptop for professionals',
    images: [
      { url: 'https://via.placeholder.com/400x400?text=MacBook+Pro', alt: 'MacBook Pro' },
    ],
    price: 349900,
    currency: 'USD',
    rating: 4.9,
    reviewCount: 1540,
    stockCount: 12,
    maxStock: 50,
    badge: 'best_seller',
    colors: [
      { label: 'Space Black', hex: '#1D1D1D', inStock: true },
      { label: 'Silver', hex: '#E8E8E8', inStock: false },
    ],
    specs: [
      { label: 'M3 Max' },
      { label: '36GB RAM' },
      { label: '16" Display' },
    ],
    categoryId: 'computers',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '12')
  const categoryId = searchParams.get('categoryId')

  // Filter by category if provided
  let filtered = mockProducts
  if (categoryId) {
    filtered = mockProducts.filter((p) => p.categoryId === categoryId)
  }

  // Paginate
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedData = filtered.slice(start, end)

  return NextResponse.json({
    data: paginatedData,
    total: filtered.length,
    page,
    perPage,
  })
}
