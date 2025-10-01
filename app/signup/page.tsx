"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";


export default function SignUp() {
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
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Account created successfully!");
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <main className="flex items-center justify-center h-screen bg-gray-100">
      <form
        onSubmit={handleSignUp}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h1 className="text-xl font-bold mb-4">Create Your HarvestHub Account</h1>
        <input
          type="text"
          placeholder="Name"
          className="w-full mb-3 p-2 border rounded"
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full mb-3 p-2 border rounded"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Sign Up
        </button>
        <p className="text-sm text-center mt-3">
          Already have an account? <a href="/login" className="text-blue-600">Login</a>
        </p>
      </form>
    </main>
  );
}
