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
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="bg-green-700 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link 
            href="/home" 
            className="text-lg sm:text-xl lg:text-2xl font-bold hover:opacity-80 transition-opacity flex-shrink-0"
          >
            🌱 HarvestHub
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-6">
            <Link 
              href="/home" 
              className="px-2 py-1 hover:bg-green-600 rounded transition-colors text-sm lg:text-base"
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className="px-2 py-1 hover:bg-green-600 rounded transition-colors text-sm lg:text-base"
            >
              Products
            </Link>
            <Link 
              href="/farmers" 
              className="px-2 py-1 hover:bg-green-600 rounded transition-colors text-sm lg:text-base"
            >
              Farmers
            </Link>
            <Link 
              href="/cart" 
              className="px-2 py-1 hover:bg-green-600 rounded transition-colors text-sm lg:text-base"
            >
              Cart
            </Link>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-600 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg hover:bg-red-700 transition-colors text-sm lg:text-base font-medium"
            >
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md text-white hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
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

      {/* Mobile Navigation */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-3 pt-2 pb-4 space-y-1 bg-green-800 shadow-inner">
          <Link 
            href="/home" 
            className="block px-3 py-2.5 text-base font-medium hover:bg-green-700 active:bg-green-600 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            🏠 Home
          </Link>
          <Link 
            href="/products" 
            className="block px-3 py-2.5 text-base font-medium hover:bg-green-700 active:bg-green-600 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            🛍️ Products
          </Link>
          <Link 
            href="/farmers" 
            className="block px-3 py-2.5 text-base font-medium hover:bg-green-700 active:bg-green-600 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            👨‍🌾 Farmers
          </Link>
          <Link 
            href="/cart" 
            className="block px-3 py-2.5 text-base font-medium hover:bg-green-700 active:bg-green-600 rounded-md transition-colors"
            onClick={() => setIsOpen(false)}
          >
            🛒 Cart
          </Link>
          <div className="pt-2 border-t border-green-700">
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left px-3 py-2.5 text-base font-medium bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-md transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
