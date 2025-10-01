"use client";

import Navbar from "../components/Navbar";

export default function FarmerProfile() {
  // ✅ Mock farmer data (later you can fetch from DB)
  const farmer = {
    name: "Juan Dela Cruz",
    location: "Nueva Ecija, Philippines",
    crops: ["Rice", "Corn", "Vegetables"],
    experience: "10 years in sustainable farming",
    bio: "Dedicated farmer using organic practices to grow healthy crops and connect with buyers directly.",
    rating: 4.8,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Profile Section */}
      <section className="max-w-4xl mx-auto p-8">
        <div className="bg-white shadow rounded-xl p-6">
          <div className="flex items-center gap-6">
            {/* Avatar / Farmer Image */}
            <img
              src="/farmer.png"
              alt="Farmer Profile"
              className="w-32 h-32 rounded-full border-4 border-green-600"
            />

            <div>
              <h1 className="text-3xl font-bold text-green-700">{farmer.name}</h1>
              <p className="text-gray-600">{farmer.location}</p>
              <p className="mt-2 text-sm text-gray-500 italic">
                {farmer.experience}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-green-700">About</h2>
            <p className="text-gray-700 mt-2">{farmer.bio}</p>
          </div>

          {/* Crops */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-green-700">Crops Grown</h2>
            <ul className="flex flex-wrap gap-3 mt-2">
              {farmer.crops.map((crop, index) => (
                <li
                  key={index}
                  className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {crop}
                </li>
              ))}
            </ul>
          </div>

          {/* Rating */}
          <div className="mt-6">
            <h2 className="text-xl font-semibold text-green-700">Rating</h2>
            <p className="text-yellow-500 font-bold text-lg">
              ⭐ {farmer.rating} / 5
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
