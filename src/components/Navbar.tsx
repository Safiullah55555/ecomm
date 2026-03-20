import Link from "next/link"
import { Button } from "@/components/ui/button"

const Navbar = () => {
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

          {/* Register Button */}
          <Button
            asChild
            // className="bg-neutral-900 text-white hover:opacity-80 font-medium px-5"
            className="text-[12px] font-medium rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            <Link href="/login">Register</Link>
          </Button>

        </div>
      </div>
    </nav>
  )
}

export default Navbar