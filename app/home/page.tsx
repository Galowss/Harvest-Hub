"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

type User = {
  name: string;
  email: string;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loggedUser = { name: "John Doe", email: "john@example.com" };
    setUser(loggedUser);
  }, []);

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />
      <div className="px-6 py-10">
        <h1 className="text-3xl font-bold text-green-800 mb-4">Welcome back, {user?.name}!</h1>
        <p className="text-gray-700">Explore fresh farm products and support our local farmers 🌾</p>
      </div>
    </main>
  );
}
