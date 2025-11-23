"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpFarmer() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Send email verification
      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        contact,
        address,
        email,
        role: "farmer",
        emailVerified: false,
      });

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 overflow-hidden">
        {/* Animated Background Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl w-full max-w-md border border-green-100 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-700 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Farmer Account Created!
          </h2>
          
          <p className="text-gray-600 mb-6">
            Welcome to HarvestHub! Please check your email to verify your account before logging in.
          </p>
          
          <Link href="/login">
            <button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
              Go to Login
            </button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

      <form onSubmit={handleSignUp} className="relative bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border border-green-100">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img 
            src="/harvest-hub-logo.png" 
            alt="HarvestHub Logo" 
            className="w-16 h-16 object-contain transition-transform hover:scale-110"
          />
        </div>

        <h1 className="text-lg sm:text-xl font-bold mb-6 text-center bg-gradient-to-r from-emerald-700 via-green-600 to-teal-600 bg-clip-text text-transparent">
          Sign Up as Farmer
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              placeholder="Juan Dela Cruz"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
            <input
              type="text"
              placeholder="+63 912 345 6789"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Farm Address (Optional)</label>
            <textarea
              placeholder="Barangay, Municipality, Province"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[80px] resize-vertical transition-all duration-200"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              placeholder="your.email@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl mt-6"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : "Sign Up as Farmer"}
        </button>

        <div className="text-center mt-6 pt-6 border-t border-gray-200 space-y-2">
          <p className="text-xs sm:text-sm text-gray-600">
            Want to be a regular user?{" "}
            <Link href="/signup" className="text-green-600 hover:text-green-700 font-semibold hover:underline transition-colors">
              Sign Up as User
            </Link>
          </p>

          <p className="text-xs sm:text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-colors">
              Login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
