import React, { Suspense } from 'react'
import { ProductGridSkeleton, ProductGrid } from '@/components/subcomponents/product-card'

const Products = () => {
  return (
    <div>
        <Suspense fallback={<ProductGridSkeleton count={6} />}>
            <ProductGrid/>
        </Suspense>
    </div>
  )
}

export default Products