import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/products - Fetch products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    if (brand) {
      where.brand = {
        slug: brand,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { brand: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseInt(minPrice) * 100;
      if (maxPrice) where.price.lte = parseInt(maxPrice) * 100;
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          categories: {
            include: {
              category: true,
            },
          },
          images: {
            orderBy: {
              position: "asc",
            },
          },
          colors: true,
          specs: true,
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Transform products for API response
    const transformedProducts = products.map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      brand: product.brand.name,
      brandId: product.brand.id,
      price: product.price / 100, // Convert cents to dollars
      originalPrice: product.originalPrice ? product.originalPrice / 100 : null,
      currency: product.currency,
      rating: product.ratingAvg,
      reviewCount: product.reviewCount,
      stockCount: product.stockCount,
      maxStock: product.maxStock,
      badge: product.badge,
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt,
      })),
      colors: product.colors,
      specs: product.specs.map((spec) => ({ label: spec.label })),
      categories: product.categories.map((pc) => ({

        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    return NextResponse.json({
      data: transformedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product (Admin only)
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const {
      name,
      brandId,
      price,
      stockCount,
      maxStock,
      categories,
      images,
    } = body;

    if (!name || !brandId || !price || !categories || !images) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Product with this name already exists" },
        { status: 400 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: body.description,
        brandId,
        price: Math.round(price * 100), // Convert to cents
        originalPrice: body.originalPrice ? Math.round(body.originalPrice * 100) : null,
        stockCount,
        maxStock,
        badge: body.badge,
        categories: {
          create: categories.map((categoryId: string) => ({
            categoryId,
          })),
        },
        images: {
          create: images.map((img: any, index: number) => ({
            url: img.url,
            alt: img.alt || name,
            position: index,
          })),
        },
        colors: body.colors
          ? {
              create: body.colors,
            }
          : undefined,
        specs: body.specs
          ? {
              create: body.specs.map((spec: string) => ({
                label: spec,
              })),
            }
          : undefined,
      },
      include: {
        brand: true,
        categories: {
          include: {
            category: true,
          },
        },
        images: true,
        colors: true,
        specs: true,
      },
    });

    // Transform response
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      brand: product.brand.name,
      brandId: product.brand.id,
      price: product.price / 100,
      originalPrice: product.originalPrice ? product.originalPrice / 100 : null,
      currency: product.currency,
      stockCount: product.stockCount,
      maxStock: product.maxStock,
      badge: product.badge,
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt,
      })),
      colors: product.colors,
      specs: product.specs.map((spec) => ({ label: spec.label })),
      categories: product.categories.map((pc) => ({

        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json(transformedProduct, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// PUT /api/products - Update a product (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Build update data
    const data: any = {};

    if (updateData.name) {
      data.name = updateData.name;
      data.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.brandId) data.brandId = updateData.brandId;
    if (updateData.price !== undefined) data.price = Math.round(updateData.price * 100);
    if (updateData.originalPrice !== undefined)
      data.originalPrice = updateData.originalPrice ? Math.round(updateData.originalPrice * 100) : null;
    if (updateData.stockCount !== undefined) data.stockCount = updateData.stockCount;
    if (updateData.maxStock !== undefined) data.maxStock = updateData.maxStock;
    if (updateData.badge !== undefined) data.badge = updateData.badge;
    if (updateData.isActive !== undefined) data.isActive = updateData.isActive;

    // Handle categories update
    if (updateData.categories) {
      data.categories = {
        deleteMany: {},
        create: updateData.categories.map((categoryId: string) => ({
          categoryId,
        })),
      };
    }

    // Handle images update
    if (updateData.images) {
      data.images = {
        deleteMany: {},
        create: updateData.images.map((img: any, index: number) => ({
          url: img.url,
          alt: img.alt || updateData.name || "Product image",
          position: index,
        })),
      };
    }

    // Handle colors update
    if (updateData.colors !== undefined) {
      data.colors = {
        deleteMany: {},
        create: updateData.colors || [],
      };
    }

    // Handle specs update
    if (updateData.specs !== undefined) {
      data.specs = {
        deleteMany: {},
        create: (updateData.specs || []).map((spec: string) => ({
          label: spec,
        })),
      };
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        brand: true,
        categories: {
          include: {
            category: true,
          },
        },
        images: true,
        colors: true,
        specs: true,
      },
    });

    // Transform response
    const transformedProduct = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      brand: product.brand.name,
      brandId: product.brand.id,
      price: product.price / 100,
      originalPrice: product.originalPrice ? product.originalPrice / 100 : null,
      currency: product.currency,
      stockCount: product.stockCount,
      maxStock: product.maxStock,
      badge: product.badge,
      isActive: product.isActive,
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt,
      })),
      colors: product.colors,
      specs: product.specs.map((spec) => ({ label: spec.label })),
      categories: product.categories.map((pc) => ({

        id: pc.category.id,
        name: pc.category.name,
        slug: pc.category.slug,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/products - Delete a product (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
