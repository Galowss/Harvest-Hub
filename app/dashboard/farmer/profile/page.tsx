"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { auth, db } from "../../../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });

export default function FarmerProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", contact: "", lat: 14.5995, lng: 120.9842, address: "" });
  const [marker, setMarker] = useState<[number, number]>([14.5995, 120.9842]);
  const [L, setL] = useState<any>(null);
  const [markerIcon, setMarkerIcon] = useState<any>(null);
  const mapRef = useRef<any>(null);
  const router = useRouter();

  // Load Leaflet only on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => setL(leaflet));
    }
  }, []);

  // Auth check
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data().role === "farmer") {
          const lat = snap.data().lat || 14.5995;
          const lng = snap.data().lng || 120.9842;
          const address = snap.data().address || "";
          setUser({ id: currentUser.uid, ...snap.data() });
          setProfile({ name: snap.data().name || "", contact: snap.data().contact || "", lat, lng, address });
          setMarker([lat, lng]);
        } else {
          alert("Unauthorized");
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (L) {
      const icon = L.icon({
        iconUrl: "https://unpkg.com/leaflet/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      setMarkerIcon(icon);
    }
  }, [L]);

  if (loading || !L) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // Reverse geocoding using Nominatim
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      return data.display_name || "";
    } catch (err) {
      console.error(err);
      return "";
    }
  };

  const updateMarker = async (lat: number, lng: number) => {
    setMarker([lat, lng]);
    const address = await fetchAddress(lat, lng);
    setProfile({ ...profile, lat, lng, address });
  };

  const handleMapClick = async (e: any) => {
    const { lat, lng } = e.latlng;
    updateMarker(lat, lng);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!user) return;
    await setDoc(
      doc(db, "users", user.id),
      { ...profile, lat: marker[0], lng: marker[1], role: "farmer" },
      { merge: true }
    );
    alert(`Profile updated! Address: ${profile.address}`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-xl font-bold mb-6">HarvestHub</h2>
          <a href="/dashboard/farmer" className="block px-3 py-2 rounded hover:bg-green-100">
            Homepage
          </a>
          <a href="/dashboard/farmer/profile" className="block px-3 py-2 rounded hover:bg-green-100">
            Farmer Profile
          </a>
          <a
            href="/dashboard/farmer/orders"
            className="block px-3 py-2 rounded hover:bg-green-100"
          >
            Orders
          </a>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Farmer Profile</h1>
          <button onClick={handleLogout} className="bg-red-600 text-white px-4 py-2 rounded">Logout</button>
        </header>

        <section className="bg-white shadow p-6 rounded space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full border px-3 py-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Contact Info"
              value={profile.contact}
              onChange={(e) => setProfile({ ...profile, contact: e.target.value })}
              className="w-full border px-3 py-2 rounded"
              required
            />

<div className="p-2 bg-gray-100 rounded">
  <strong>Address:</strong> {profile.address || "Click on the map or drag the marker to select location"}
</div>


            {/* Show human-readable address */}
            <div>
              <strong>Selected Location:</strong> {profile.address || "Click on map or drag marker"}
            </div>

            <div className="h-64 rounded overflow-hidden">
              {L && markerIcon && (
                <MapContainer
                  center={marker}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                  ref={mapRef}
                  whenReady={() => {
                    if (mapRef.current) mapRef.current.on("click", handleMapClick);
                  }}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker
                    position={marker}
                    draggable={true}
                    eventHandlers={{
                      dragend: async (e: any) => {
                        const { lat, lng } = e.target.getLatLng();
                        updateMarker(lat, lng);
                      },
                    }}
                    icon={markerIcon}
                  />
                </MapContainer>
              )}
            </div>

            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Save Profile</button>
          </form>
        </section>
      </main>
    </div>
  );
}
