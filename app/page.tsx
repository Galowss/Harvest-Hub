"use client";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-green-100 p-6 text-center">
      <h1 className="text-5xl font-bold text-green-800 mb-6">
        Welcome to Harvest Hub 🌱
      </h1>
      <p className="text-lg text-gray-700 mb-8 max-w-xl">
        Connecting farmers, consumers, and businesses together for a sustainable
        future.
      </p>
      <div className="flex space-x-4">
        <Link
          href="/login"
          className="px-6 py-3 bg-green-700 text-white rounded-lg shadow hover:bg-green-800"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 bg-white border border-green-700 text-green-700 rounded-lg shadow hover:bg-green-50"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
