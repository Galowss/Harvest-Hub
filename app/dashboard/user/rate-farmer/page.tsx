"use client";

import { useEffect, useState } from "react";
import { auth, db } from "../../../config/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLogout } from "@/hooks/useLogout";

interface Farmer {
  id: string;
  name?: string;
  email: string;
  profilePhoto?: string;
  role: string;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

export default function RateFarmerPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { handleLogout } = useLogout();

  useEffect(() => {
    const fetchFarmers = async () => {
      try {
        const farmersQuery = query(
          collection(db, "users"),
          where("role", "==", "farmer")
        );
        const farmersSnapshot = await getDocs(farmersQuery);
        
        const farmersList: Farmer[] = [];
        farmersSnapshot.forEach((doc) => {
          const data = doc.data();
          farmersList.push({
            id: doc.id,
            name: data.name,
            email: data.email,
            profilePhoto: data.profilePhoto,
            role: data.role
          });
        });
        
        setFarmers(farmersList);
      } catch (error) {
        console.error("Error fetching farmers:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || undefined
        });
        await fetchFarmers();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading farmers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/user" className="text-green-600 hover:text-green-700">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Rate Farmers</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {farmers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No farmers found to rate.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {farmers.map((farmer) => (
              <div key={farmer.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  {farmer.profilePhoto ? (
                    <img
                      src={farmer.profilePhoto}
                      alt={farmer.name || farmer.email}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <span className="text-green-600 text-2xl font-semibold">
                        {(farmer.name || farmer.email)[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {farmer.name || farmer.email.split("@")[0]}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4">{farmer.email}</p>
                  
                  <Link
                    href={`/dashboard/user/rate-farmer/${farmer.id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors inline-block"
                  >
                    Rate This Farmer
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
