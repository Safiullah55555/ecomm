import Link from 'next/link'
import React from 'react'

const Navbar = () => {
    return (
        <nav className="bg-gray-800 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold text-white hover:text-gray-300">
                            Ecom Store
                        </Link>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* <Link href="/userdashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-300">
                            
                        </Link>
                        <Link href="/admindashboard" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-300">
                            
                        </Link> */}
                        <Link href="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-300">
                            Login
                        </Link>
                        <Link href="/signup" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition duration-300">
                            Signup
                        </Link>

                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar