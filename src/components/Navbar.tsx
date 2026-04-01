import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const Navbar = async () => {
  const session = await auth()
  const user = session?.user

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-white rounded-sm group-hover:scale-110 transition-transform duration-200" />
            <span
              className="text-white font-bold text-lg tracking-tight"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Store
            </span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {!user ? (
              // Not logged in → Register button
              <Button
                asChild
                className="bg-black text-white hover:bg-white/90 hover:opacity-80 font-medium px-5"
              >
                <Link href="/login">Register</Link>
              </Button>
            ) : (
              // Logged in → Avatar dropdown
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer ring-2 ring-white/20 hover:ring-white/40 transition-all">
                    <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
                    <AvatarFallback className="bg-white/10 text-white font-semibold">
                      {user.name?.charAt(0).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="bg-[#111111] border-white/10 text-white min-w-48"
                >
                  <DropdownMenuLabel className="text-white/60 font-normal text-xs">
                    {user.email}
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem asChild>
                    <Link
                      href="/userdashboard"
                      className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white"
                    >
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>

                  {/* Only visible to ADMIN */}
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admindashboard"
                        className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white"
                      >
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-white/10" />

                  <DropdownMenuItem asChild>
                    <form
                      action={async () => {
                        "use server"
                        await signOut({ redirectTo: "/" })
                      }}
                    >
                      <button
                        type="submit"
                        className="w-full text-left text-red-400 hover:text-red-300 cursor-pointer"
                      >
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>

                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}

export default Navbar