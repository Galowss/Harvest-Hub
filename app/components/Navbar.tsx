"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/app/config/firebase";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login"); // redirect after logout
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-green-700 text-white shadow-md">
      {/* Logo */}
      <Link href="/home" className="text-2xl font-bold hover:opacity-80">
        🌱 HarvestHub
      </Link>

      {/* Links */}
      <div className="flex space-x-6 text-lg items-center">
        <Link href="/home" className="hover:underline">Home</Link>
        <Link href="/products" className="hover:underline">Products</Link>
        <Link href="/farmers" className="hover:underline">Farmers</Link>
        <Link href="/cart" className="hover:underline">Cart</Link>
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="ml-6 bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
