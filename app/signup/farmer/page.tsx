"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SignUpFarmer() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        location,
        contact,
        email,
        role: "farmer",
      });

      alert("Farmer account created successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSignUp} className="bg-white p-6 sm:p-8 rounded shadow-md w-full max-w-sm sm:max-w-md">
        <h1 className="text-lg sm:text-xl font-bold mb-4">Sign Up as Farmer</h1>

        <input
          type="text"
          placeholder="Full Name"
          className="w-full mb-3 p-2 border rounded text-sm sm:text-base"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Location"
          className="w-full mb-3 p-2 border rounded text-sm sm:text-base"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          type="text"
          placeholder="Contact Number"
          className="w-full mb-3 p-2 border rounded text-sm sm:text-base"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded text-sm sm:text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded text-sm sm:text-base"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full mb-3 p-2 border rounded text-sm sm:text-base"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button className="w-full bg-green-600 text-white p-2 rounded text-sm sm:text-base transition-colors hover:bg-green-700">Sign Up</button>

        <p className="text-xs sm:text-sm text-center mt-3">
          Want to be a normal user?{" "}
          <Link href="/signup" className="text-blue-600 underline">
            Sign Up as User
          </Link>
        </p>

        <p className="text-xs sm:text-sm text-center mt-3">
          Already have a farmer account?{" "}
          <Link href="/login" className="text-green-600 underline">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}
