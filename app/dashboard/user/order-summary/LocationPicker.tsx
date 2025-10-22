"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });

interface LocationPickerProps {
  location: { lat: number; lng: number } | null;
  onLocationChange: (lat: number, lng: number, address?: string) => void;
}

export default function LocationPicker({ location, onLocationChange }: LocationPickerProps) {
  // Default to Manila, Philippines
  const defaultLocation: [number, number] = [14.5995, 120.9842];
  const [marker, setMarker] = useState<[number, number]>(
    location ? [location.lat, location.lng] : defaultLocation
  );
  const [L, setL] = useState<any>(null);
  const [markerIcon, setMarkerIcon] = useState<any>(null);
  const mapRef = useRef<any>(null);

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

  // Setup marker icon
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

  // Update marker when location prop changes
  useEffect(() => {
    if (location) {
      setMarker([location.lat, location.lng]);
    }
  }, [location]);

  // Reverse geocoding using Nominatim
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      return data.display_name || "";
    } catch (err) {
      console.error("Geocoding error:", err);
      return "";
    }
  };

  const updateMarker = async (lat: number, lng: number) => {
    setMarker([lat, lng]);
    const address = await fetchAddress(lat, lng);
    onLocationChange(lat, lng, address);
  };

  const handleMapClick = async (e: any) => {
    const { lat, lng } = e.latlng;
    updateMarker(lat, lng);
  };

  const handleMarkerDrag = async (e: any) => {
    const { lat, lng } = e.target.getLatLng();
    updateMarker(lat, lng);
  };

  // Try to get user's current location on mount
  useEffect(() => {
    if (!location && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setMarker(userLocation);
          updateMarker(userLocation[0], userLocation[1]);
        },
        (error) => {
          console.log("Could not get user location:", error);
        }
      );
    }
  }, []);

  if (!L || !markerIcon) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-lg flex items-center justify-center">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-96 rounded overflow-hidden border-2 border-gray-300">
        <MapContainer
          center={marker}
          zoom={15}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          whenReady={() => {
            if (mapRef.current) {
              mapRef.current.on("click", handleMapClick);
            }
          }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Marker
            position={marker}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDrag,
            }}
            icon={markerIcon}
          />
        </MapContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        📍 Click on the map or drag the marker to set your delivery location
      </p>
    </div>
  );
}
