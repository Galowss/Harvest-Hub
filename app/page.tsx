"use client";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 animate-fade-in-up">
          {/* Logo with subtle animation */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000"></div>
              <Image
                src="/harvest-hub-logo.png"
                alt="HarvestHub Logo"
                width={200}
                height={200}
                className="relative object-contain w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Main heading with gradient text */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent leading-tight">
            Welcome to<br />Harvest Hub
          </h1>
          
          {/* Subtitle with better contrast */}
          <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-xs sm:max-w-md lg:max-w-2xl mx-auto leading-relaxed font-medium">
            Connecting farmers, consumers, and businesses together for a<br className="hidden sm:block" />
            <span className="text-green-700 font-semibold">sustainable future</span>
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="text-green-600">🌾</span>
              <span>Fresh Produce</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="text-green-600">🚜</span>
              <span>Direct from Farmers</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
              <span className="text-green-600">💚</span>
              <span>Eco-Friendly</span>
            </div>
          </div>

          {/* CTA buttons with enhanced styling */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm sm:max-w-md mx-auto pt-4">
            <Link
              href="/login"
              className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-center overflow-hidden"
            >
              <span className="relative z-10">Login</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
            <Link
              href="/signup"
              className="group relative w-full sm:w-auto px-8 py-4 bg-white text-green-700 font-semibold rounded-xl shadow-lg hover:shadow-2xl border-2 border-green-600 transform hover:scale-105 transition-all duration-300 text-center overflow-hidden"
            >
              <span className="relative z-10">Sign Up</span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
            </Link>
          </div>

          {/* Browse as Guest option */}
          <div className="pt-2">
            <Link
              href="/dashboard/user"
              className="inline-block text-gray-600 hover:text-green-700 font-medium text-sm underline transition-colors"
            >
              Or browse as guest without an account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
