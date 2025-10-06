"use client";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="gradient-background">
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <Image
          src="/harvest-hub-logo.png"
          alt="HarvestHub Logo"
          width={200}
          height={100}
          className="object-contain z-10 w-32 h-16 sm:w-48 sm:h-24 lg:w-56 lg:h-28"
          priority
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-green-800 mb-4 sm:mb-6 text-center">
          Welcome to Harvest Hub
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-6 sm:mb-8 max-w-xs sm:max-w-md lg:max-w-xl text-center px-4">
          Connecting farmers, consumers, and businesses together for a
          sustainable future.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center w-full max-w-sm sm:max-w-md">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-green-700 text-white rounded-lg shadow hover:bg-green-800 text-center text-sm sm:text-base transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-white border border-green-700 text-green-700 rounded-lg shadow hover:bg-green-50 text-center text-sm sm:text-base transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
