"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/app/config/firebase"; // adjust if needed
import { useRouter } from "next/navigation";

export function useLogout() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login"); // redirect to login after logout
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return { handleLogout };
}
