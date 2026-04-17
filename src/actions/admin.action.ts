"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.product.count({
        where: {
          stockCount: { lte: 10 },
          isActive: true,
        },
      }),
    ]);

    return {
      totalProducts,
      totalOrders,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingOrders,
      lowStockProducts,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error("Failed to fetch dashboard stats");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getProducts(filters?: {
  search?: string;
  category?: string;
  brand?: string;
  status?: "active" | "inactive";
  page?: number;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters?.category) {
      where.categories = {
        some: { category: { slug: filters.category } },
      };
    }

    if (filters?.brand) {
      where.brand = { slug: filters.brand };
    }

    if (filters?.status) {
      where.isActive = filters.status === "active";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          categories: { include: { category: true } },
          images: { orderBy: { position: "asc" } },
          _count: { select: { reviews: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Failed to fetch products");
  }
}

export async function createProduct(data: {
  name: string;
  description?: string;
  brandId: string;
  price: number;
  originalPrice?: number;
  stockCount: number;
  maxStock: number;
  categories: string[];
  images: { url: string; alt: string; position: number }[];
  colors?: { label: string; hex: string; inStock: boolean }[];
  specs?: { label: string }[];
  badge?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        brandId: data.brandId,
        price: Math.round(data.price * 100), // Convert to cents
        originalPrice: data.originalPrice ? Math.round(data.originalPrice * 100) : null,
        stockCount: data.stockCount,
        maxStock: data.maxStock,
        badge: data.badge as any,
        categories: {
          create: data.categories.map((categoryId) => ({
            categoryId,
          })),
        },
        images: {
          create: data.images,
        },
        colors: data.colors
          ? {
              create: data.colors,
            }
          : undefined,
        specs: data.specs
          ? {
              create: data.specs,
            }
          : undefined,
      },
      include: {
        brand: true,
        categories: { include: { category: true } },
        images: true,
        colors: true,
        specs: true,
      },
    });

    revalidatePath("/admindashboard");
    return product;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Failed to create product");
  }
}

export async function updateProduct(
  productId: string,
  data: Partial<{
    name: string;
    description: string;
    brandId: string;
    price: number;
    originalPrice: number;
    stockCount: number;
    maxStock: number;
    categories: string[];
    images: { url: string; alt: string; position: number }[];
    colors: { label: string; hex: string; inStock: boolean }[];
    specs: { label: string }[];
    badge: string;
    isActive: boolean;
  }>
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const updateData: any = {};

    if (data.name) {
      updateData.name = data.name;
      updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }

    if (data.description !== undefined) updateData.description = data.description;
    if (data.brandId) updateData.brandId = data.brandId;
    if (data.price !== undefined) updateData.price = Math.round(data.price * 100);
    if (data.originalPrice !== undefined)
      updateData.originalPrice = data.originalPrice ? Math.round(data.originalPrice * 100) : null;
    if (data.stockCount !== undefined) updateData.stockCount = data.stockCount;
    if (data.maxStock !== undefined) updateData.maxStock = data.maxStock;
    if (data.badge) updateData.badge = data.badge;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    if (data.categories) {
      updateData.categories = {
        deleteMany: {},
        create: data.categories.map((categoryId) => ({
          categoryId,
        })),
      };
    }

    if (data.images) {
      updateData.images = {
        deleteMany: {},
        create: data.images,
      };
    }

    if (data.colors) {
      updateData.colors = {
        deleteMany: {},
        create: data.colors,
      };
    }

    if (data.specs) {
      updateData.specs = {
        deleteMany: {},
        create: data.specs,
      };
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        brand: true,
        categories: { include: { category: true } },
        images: true,
        colors: true,
        specs: true,
      },
    });

    revalidatePath("/admindashboard");
    return product;
  } catch (error) {
    console.error("Error updating product:", error);
    throw new Error("Failed to update product");
  }
}

export async function deleteProduct(productId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/admindashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    throw new Error("Failed to delete product");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getCategories() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { products: true } },
        parent: true,
        children: true,
      },
      orderBy: { name: "asc" },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function createCategory(data: {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const category = await prisma.category.create({
      data,
      include: {
        parent: true,
        children: true,
      },
    });

    revalidatePath("/admindashboard");
    return category;
  } catch (error) {
    console.error("Error creating category:", error);
    throw new Error("Failed to create category");
  }
}

export async function updateCategory(
  categoryId: string,
  data: Partial<{
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    parentId: string;
  }>
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: {
        parent: true,
        children: true,
      },
    });

    revalidatePath("/admindashboard");
    return category;
  } catch (error) {
    console.error("Error updating category:", error);
    throw new Error("Failed to update category");
  }
}

export async function deleteCategory(categoryId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath("/admindashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BRAND MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getBrands() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const brands = await prisma.brand.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return brands;
  } catch (error) {
    console.error("Error fetching brands:", error);
    throw new Error("Failed to fetch brands");
  }
}

export async function createBrand(data: {
  name: string;
  slug: string;
  logoUrl?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const brand = await prisma.brand.create({
      data,
    });

    revalidatePath("/admindashboard");
    return brand;
  } catch (error) {
    console.error("Error creating brand:", error);
    throw new Error("Failed to create brand");
  }
}

export async function updateBrand(
  brandId: string,
  data: Partial<{
    name: string;
    slug: string;
    logoUrl: string;
  }>
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const brand = await prisma.brand.update({
      where: { id: brandId },
      data,
    });

    revalidatePath("/admindashboard");
    return brand;
  } catch (error) {
    console.error("Error updating brand:", error);
    throw new Error("Failed to update brand");
  }
}

export async function deleteBrand(brandId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    await prisma.brand.delete({
      where: { id: brandId },
    });

    revalidatePath("/admindashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting brand:", error);
    throw new Error("Failed to delete brand");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrders(filters?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search } },
        { user: { email: { contains: filters.search, mode: "insensitive" } } },
        { user: { name: { contains: filters.search, mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, images: { take: 1 } } },
            },
          },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
}

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        statusHistory: {
          create: {
            status: status as any,
            note,
          },
        },
      },
      include: {
        statusHistory: true,
      },
    });

    revalidatePath("/admindashboard");
    return order;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw new Error("Failed to update order status");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getUsers(filters?: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
}

export async function updateUserRole(userId: string, role: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: { id: true, name: true, email: true, role: true },
    });

    revalidatePath("/admindashboard");
    return user;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw new Error("Failed to update user role");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getReviews(filters?: {
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    throw new Error("Failed to fetch reviews");
  }
}

export async function updateReviewStatus(reviewId: string, status: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: status as any },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    revalidatePath("/admindashboard");
    return review;
  } catch (error) {
    console.error("Error updating review status:", error);
    throw new Error("Failed to update review status");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COUPON MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function getCoupons() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return coupons;
  } catch (error) {
    console.error("Error fetching coupons:", error);
    throw new Error("Failed to fetch coupons");
  }
}

export async function createCoupon(data: {
  code: string;
  type: string;
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  expiresAt?: Date;
}) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type as any,
        value: data.type === "PERCENTAGE" ? data.value : Math.round(data.value * 100),
        minOrderAmount: data.minOrderAmount ? Math.round(data.minOrderAmount * 100) : null,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
      },
    });

    revalidatePath("/admindashboard");
    return coupon;
  } catch (error) {
    console.error("Error creating coupon:", error);
    throw new Error("Failed to create coupon");
  }
}

export async function updateCoupon(
  couponId: string,
  data: Partial<{
    code: string;
    type: string;
    value: number;
    minOrderAmount: number;
    maxUses: number;
    expiresAt: Date;
    isActive: boolean;
  }>
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const updateData: any = {};

    if (data.code) updateData.code = data.code.toUpperCase();
    if (data.type) updateData.type = data.type;
    if (data.value !== undefined)
      updateData.value = data.type === "PERCENTAGE" ? data.value : Math.round(data.value * 100);
    if (data.minOrderAmount !== undefined)
      updateData.minOrderAmount = data.minOrderAmount ? Math.round(data.minOrderAmount * 100) : null;
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const coupon = await prisma.coupon.update({
      where: { id: couponId },
      data: updateData,
    });

    revalidatePath("/admindashboard");
    return coupon;
  } catch (error) {
    console.error("Error updating coupon:", error);
    throw new Error("Failed to update coupon");
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    await prisma.coupon.delete({
      where: { id: couponId },
    });

    revalidatePath("/admindashboard");
    return { success: true };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    throw new Error("Failed to delete coupon");
  }
}