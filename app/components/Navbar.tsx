"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/config/firebase";
import { useState } from "react";

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login"); // redirect after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/home" className="text-xl sm:text-2xl font-bold hover:opacity-80 flex-shrink-0">
            🌱 HarvestHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            <Link href="/home" className="hover:underline text-sm lg:text-base">Home</Link>
            <Link href="/products" className="hover:underline text-sm lg:text-base">Products</Link>
            <Link href="/farmers" className="hover:underline text-sm lg:text-base">Farmers</Link>
            <Link href="/cart" className="hover:underline text-sm lg:text-base">Cart</Link>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 lg:px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm lg:text-base"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-gray-300 focus:outline-none focus:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-green-800">
            <Link href="/home" className="block px-3 py-2 text-base font-medium hover:bg-green-700 rounded-md">Home</Link>
            <Link href="/products" className="block px-3 py-2 text-base font-medium hover:bg-green-700 rounded-md">Products</Link>
            <Link href="/farmers" className="block px-3 py-2 text-base font-medium hover:bg-green-700 rounded-md">Farmers</Link>
            <Link href="/cart" className="block px-3 py-2 text-base font-medium hover:bg-green-700 rounded-md">Cart</Link>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-3 py-2 text-base font-medium bg-red-600 hover:bg-red-700 rounded-md mt-2"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
