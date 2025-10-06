"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpUser() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match!");
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
        email,
        role: "user",
        emailVerified: false,
      });

      alert("Account created successfully! Please check your email to verify your account before logging in.");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form onSubmit={handleSignUp} className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-sm sm:max-w-md">
        <h1 className="text-lg sm:text-xl font-bold mb-6 text-center">Sign Up as User</h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 border rounded text-sm sm:text-base focus:ring focus:ring-blue-300"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="text"
            placeholder="Contact Number"
            className="w-full p-3 border rounded text-sm sm:text-base focus:ring focus:ring-blue-300"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 border rounded text-sm sm:text-base focus:ring focus:ring-blue-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 border rounded text-sm sm:text-base focus:ring focus:ring-blue-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 border rounded text-sm sm:text-base focus:ring focus:ring-blue-300"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded text-sm sm:text-base transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? "Creating Account..." : "Sign Up"}
        </button>

        <div className="text-center mt-4 space-y-2">
          <p className="text-xs sm:text-sm">
            Want to be a farmer?{" "}
            <Link href="/signup/farmer" className="text-green-600 underline">
              Sign Up as Farmer
            </Link>
          </p>

          <p className="text-xs sm:text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-green-600 underline">
              Login
            </Link>
          </p>
        </div>
      </form>
    </main>
  );
}
