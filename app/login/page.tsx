"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const role = userDoc.data().role;
        if (role === "farmer") {
          router.push("/dashboard/farmer");
        } else if (role === "user") {
          router.push("/dashboard/user");
        } else {
          setError("No role assigned to this account.");
        }
      } else {
        setError("No role assigned to this account.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm sm:max-w-md">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6">Login to HarvestHub</h2>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-green-300 text-sm sm:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring focus:ring-green-300 text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 text-sm sm:text-base transition-colors"
          >
            Login
          </button>
        </form>

        <p className="text-xs sm:text-sm text-center mt-4">
          Don’t have an account?{" "}
          <a href="/signup" className="text-green-600 hover:underline">Sign Up</a>{" "}
          |{" "}
          <a href="/signup/farmer" className="text-green-600 hover:underline">Sign Up as Farmer</a>
        </p>
        
      </div>
    </div>
  );
}
