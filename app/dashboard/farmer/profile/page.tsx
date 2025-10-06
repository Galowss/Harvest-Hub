"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { auth, db } from "../../../config/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import ClientOnly from "@/components/ClientOnly";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });

export default function FarmerProfile() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: "", contact: "", lat: 14.839773106786701, lng: 120.28621753207575, address: "", profilePhoto: "" });
  const [marker, setMarker] = useState<[number, number]>([14.839773106786701, 120.28621753207575]);
  const [L, setL] = useState<any>(null);
  const [markerIcon, setMarkerIcon] = useState<any>(null);
  const [overallRating, setOverallRating] = useState({ average: 0, count: 0 });
  const [uploading, setUploading] = useState(false);
  const mapRef = useRef<any>(null);
  const router = useRouter();

  // Fetch farmer's overall rating
  const fetchFarmerRating = async (farmerId: string) => {
    try {
      const q = query(collection(db, "ratings"), where("farmerId", "==", farmerId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setOverallRating({ average: 0, count: 0 });
        return;
      }
      
      let totalRating = 0;
      let count = 0;
      
      querySnapshot.forEach((doc) => {
        const rating = doc.data().rating || 0;
        totalRating += rating;
        count++;
      });
      
      const average = count > 0 ? totalRating / count : 0;
      setOverallRating({ average: parseFloat(average.toFixed(1)), count });
    } catch (error) {
      console.error("Error fetching ratings:", error);
      setOverallRating({ average: 0, count: 0 });
    }
  };

  // Load Leaflet only on client
  useEffect(() => {
    let isMounted = true;
    
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        if (isMounted) {
          setL(leaflet);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
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
          const userData = snap.data();
          const lat = userData.lat || 14.5995;
          const lng = userData.lng || 120.9842;
          const address = userData.address || "";
          const profilePhoto = userData.profilePhoto || "";
          
          setUser({ id: currentUser.uid, ...userData });
          setProfile({ 
            name: userData.name || "", 
            contact: userData.contact || "", 
            lat, 
            lng, 
            address,
            profilePhoto
          });
          setMarker([lat, lng]);
          
          // Fetch farmer ratings
          await fetchFarmerRating(currentUser.uid);
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
  // Compress image using canvas
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle profile photo upload
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }
    
    setUploading(true);
    try {
      // Compress image first
      const compressedBase64 = await compressImage(file);
      
      // Update profile with photo
      setProfile(prev => ({ ...prev, profilePhoto: compressedBase64 }));
      
      // Save profile photo to Firebase immediately
      if (user) {
        await setDoc(
          doc(db, "users", user.id),
          { profilePhoto: compressedBase64 },
          { merge: true }
        );
        alert('Profile photo updated successfully!');
      }
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  // Remove profile photo
  const removeProfilePhoto = async () => {
    try {
      setProfile(prev => ({ ...prev, profilePhoto: '' }));
      
      // Remove profile photo from Firebase
      if (user) {
        await setDoc(
          doc(db, "users", user.id),
          { profilePhoto: '' },
          { merge: true }
        );
        alert('Profile photo removed successfully!');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo');
    }
  };

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
    
    try {
      await setDoc(
        doc(db, "users", user.id),
        { 
          ...profile, 
          lat: marker[0], 
          lng: marker[1], 
          role: "farmer",
          profilePhoto: profile.profilePhoto
        },
        { merge: true }
      );
      alert(`Profile updated! Address: ${profile.address}`);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      <aside className="w-full lg:w-64 bg-white shadow-md p-4 lg:h-screen overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-bold mb-4 lg:mb-6">HarvestHub</h2>
        <nav className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
          <a href="/dashboard/farmer" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Dashboard
          </a>
          <a href="/dashboard/farmer/profile" className="block px-3 py-2 rounded bg-green-100 text-green-800 whitespace-nowrap text-sm lg:text-base">
            Profile
          </a>
          <a href="/dashboard/farmer/orders" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Orders
          </a>
          <a href="/dashboard/farmer/ratings" className="block px-3 py-2 rounded hover:bg-green-100 whitespace-nowrap text-sm lg:text-base">
            Ratings
          </a>
        </nav>
        
        {/* Logout Button */}
        <div className="mt-auto pt-4 lg:pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded transition-colors text-sm lg:text-base"
          >
            <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <header className="flex items-center justify-between mb-4 lg:mb-6">
          <h1 className="text-xl font-bold">Farmer Profile</h1>
        </header>

        <section className="bg-white shadow p-6 rounded space-y-4">
                  <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Profile Photo</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                {profile.profilePhoto ? (
                  <div className="relative">
                    <img
                      src={profile.profilePhoto}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeProfilePhoto}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                />
                <p className="text-xs text-gray-500">JPG, PNG up to 10MB (auto-compressed)</p>
                {uploading && <p className="text-xs text-blue-600">Uploading...</p>}
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Farmer Rating</h2>
              <button
                onClick={() => user && fetchFarmerRating(user.id)}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Refresh Rating
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-6 h-6 ${
                      star <= overallRating.average ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold">{overallRating.average}</span> out of 5
                {overallRating.count > 0 && (
                  <span className="ml-1">({overallRating.count} review{overallRating.count !== 1 ? 's' : ''})</span>
                )}
                {overallRating.count === 0 && (
                  <span className="ml-1 text-gray-400">(No reviews yet)</span>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
            <div className="space-y-4">
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
            </div>
          </div>

          {/* Location Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Farm Location</h2>
            <div className="space-y-4">
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
            </div>
          </div>

          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
            Save Profile
          </button>
          </form>
        </section>
      </main>
    </div>
  );
}
