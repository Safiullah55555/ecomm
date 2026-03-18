"use server"

import { prisma } from "@/lib/prisma"
import { loginSchema, signUpSchema } from "@/lib/validations/auth"
import bcrypt from "bcryptjs"


//  <------------------------SIGN UP ACTION------------------------>

export async function signUpAction(formData: {
    name: string
    email: string
    password: string
}) {

    try {
        // 1. Validate input
        const parsed = signUpSchema.safeParse(formData)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0].message,
            }
        }

        const { name, email, password } = parsed.data

        // 2. Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return {
                success: false,
                error: "Email already in use",
            }
        }

        // 3. Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // 4. Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                // role defaults to CUSTOMER from schema
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        })

        return {
            success: true,
            user,
        }
    } catch (error) {
        console.error("[signUpAction error] in action", error)
        return {
            success: false,
            error: "Something went wrong during signup auth.action",
        }
    }
}

//  <------------------------LOGIN ACTION------------------------>

export async function loginAction(formData: {
    email: string
    password: string
}) {
    try {
        const parsed = loginSchema.safeParse(formData)
        if (!parsed.success) {
            return {
                success: false,
                error: parsed.error.issues[0].message,
            }
        }

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                passwordHash: true,
            },
        })

        if (!user || !user.passwordHash) {
            return {
                success: false,
                error: "Invalid email or password",
            }
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)
        if (!isValid) {
            return {
                success: false,
                error: "Invalid email or password",
            }
        }

        const { passwordHash: _, ...safeUser } = user

        return {
            success: true,
            user: safeUser,
        }

    } catch (error) {
        console.error("[loginAction error] in action", error)
        return {
            success: false,
            error: "Something went wrong during login auth.action",
        }
    }
}
