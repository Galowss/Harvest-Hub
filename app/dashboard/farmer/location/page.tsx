"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../config/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function FarmerLocationSetup() {
  const [user, setUser] = useState<any>(null);
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  }>({
    lat: 14.5995, // Default to Quezon City
    lng: 120.9842,
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const docRef = doc(db, "users", currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = { id: currentUser.uid, ...docSnap.data() } as any;
        setUser(userData);

        // Load existing location if available
        if (userData.location) {
          setLocation({
            lat: userData.location.lat || 14.5995,
            lng: userData.location.lng || 120.9842,
            address: userData.location.address || "",
          });
        }
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding (free, no API key)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'HarvestHub/1.0' // Required by Nominatim
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        const address = data.display_name || data.address?.city || data.address?.town || data.address?.village || "Unknown Location";
        return address;
      }
    } catch (error) {
      console.error("Error fetching address:", error);
    }
    return "";
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    setMessage("Getting your GPS location...");

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setMessage("📍 Location found! Fetching address...");
          
          // Fetch address from coordinates
          const address = await fetchAddress(lat, lng);
          
          setLocation({
            lat: lat,
            lng: lng,
            address: address,
          });
          
          setMessage(
            `✅ Location retrieved!\n📍 Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n📫 Address: ${address || "Address not found"}`
          );
          setGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setMessage(
            "❌ Could not get location. Please enter manually or check permissions."
          );
          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setMessage("❌ Geolocation is not supported by your browser");
      setGettingLocation(false);
    }
  };

  const saveLocation = async () => {
    if (!user) return;

    if (!location.lat || !location.lng) {
      setMessage("❌ Please provide valid coordinates");
      return;
    }

    setSaving(true);
    setMessage("Saving location...");

    try {
      await updateDoc(doc(db, "users", user.id), {
        location: {
          lat: parseFloat(location.lat.toString()),
          lng: parseFloat(location.lng.toString()),
          address: location.address || "",
        },
      });

      setMessage("✅ Location saved successfully! You can now close this page.");
      
      // Redirect to map after 2 seconds
      setTimeout(() => {
        router.push("/dashboard/map");
      }, 2000);
    } catch (error) {
      console.error("Error saving location:", error);
      setMessage("❌ Failed to save location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const sampleLocations = [
    { name: "Quezon City", lat: 14.5995, lng: 120.9842 },
    { name: "Mandaluyong", lat: 14.5547, lng: 121.0244 },
    { name: "Marikina", lat: 14.676, lng: 121.0437 },
    { name: "Pasig", lat: 14.5243, lng: 121.0792 },
    { name: "Makati", lat: 14.5547, lng: 121.0244 },
    { name: "Taguig", lat: 14.5176, lng: 121.0509 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">📍 Set Your Farm Location</h1>
          <p className="text-gray-600">
            Add your location to appear on the farmer map and help buyers find you!
          </p>
        </div>

        {/* Current User */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">Setting location for:</p>
          <p className="font-bold text-lg">{user?.name || user?.email}</p>
          <p className="text-xs text-gray-500">Role: {user?.role}</p>
        </div>

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Location Details</h2>

          {/* GPS Button */}
          <div className="mb-6">
            <button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center space-x-2"
            >
              <span className="text-xl">📍</span>
              <span>
                {gettingLocation
                  ? "Getting Location..."
                  : "Use My Current GPS Location"}
              </span>
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Allow location permission when prompted
            </p>
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={location.lat}
                  onChange={(e) =>
                    setLocation({ ...location, lat: parseFloat(e.target.value) })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="14.5995"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={location.lng}
                  onChange={(e) =>
                    setLocation({ ...location, lng: parseFloat(e.target.value) })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="120.9842"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Address (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location.address}
                  onChange={(e) =>
                    setLocation({ ...location, address: e.target.value })
                  }
                  className="flex-1 border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., Quezon City, Metro Manila"
                />
                <button
                  onClick={async () => {
                    if (location.lat && location.lng) {
                      setMessage("🔍 Fetching address...");
                      const address = await fetchAddress(location.lat, location.lng);
                      setLocation({ ...location, address });
                      setMessage(address ? `✅ Address found: ${address}` : "⚠️ Could not fetch address");
                    } else {
                      setMessage("⚠️ Please enter coordinates first");
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm whitespace-nowrap"
                >
                  🔍 Fetch
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Click "Fetch" to automatically get address from coordinates
              </p>
            </div>
          </div>

          {/* Sample Locations */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">
              Quick Select (Metro Manila):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {sampleLocations.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() =>
                    setLocation({
                      ...location,
                      lat: sample.lat,
                      lng: sample.lng,
                      address: `${sample.name}, Metro Manila`,
                    })
                  }
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded text-sm text-left transition-colors"
                >
                  📍 {sample.name}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                message.startsWith("✅")
                  ? "bg-green-50 text-green-800"
                  : message.startsWith("❌")
                  ? "bg-red-50 text-red-800"
                  : "bg-blue-50 text-blue-800"
              }`}
            >
              {message}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={saveLocation}
            disabled={saving || !location.lat || !location.lng}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? "Saving..." : "💾 Save Location"}
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold mb-2">📖 How to Get Coordinates:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <strong>Use GPS button above</strong> (easiest - uses your current
              location)
            </li>
            <li>
              <strong>Google Maps:</strong> Right-click any location → "What's
              here?" → Copy coordinates
            </li>
            <li>
              <strong>Quick select:</strong> Choose from sample Metro Manila
              locations above
            </li>
            <li>
              <strong>Online tool:</strong> Visit{" "}
              <a
                href="https://www.latlong.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                latlong.net
              </a>{" "}
              and search your address
            </li>
          </ol>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold mb-4">📍 Location Preview</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <p className="text-sm">
              <span className="font-medium">Latitude:</span> {location.lat}
            </p>
            <p className="text-sm">
              <span className="font-medium">Longitude:</span> {location.lng}
            </p>
            {location.address && (
              <p className="text-sm">
                <span className="font-medium">Address:</span> {location.address}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-4">
              This location will be visible to buyers on the farmer map
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard/farmer"
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
