"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapComponentProps {
  userLocation: { lat: number; lng: number };
  farmers: Array<{
    id: string;
    name: string;
    location?: { lat: number; lng: number; address?: string };
    products: any[];
    distance?: number;
  }>;
  onFarmerClick: (farmer: any) => void;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
}

export default function MapComponent({
  userLocation,
  farmers,
  onFarmerClick,
  onLocationChange,
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapRef.current) return; // Already initialized

    // Create map
    const map = L.map("leaflet-map").setView(
      [userLocation.lat, userLocation.lng],
      11
    );

    // Add tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add user marker (blue)
    const userIcon = L.divIcon({
      className: "custom-user-marker",
      html: `<div style="
        background-color: #4285F4;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const userMarker = L.marker([userLocation.lat, userLocation.lng], {
      icon: userIcon,
      zIndexOffset: 1000,
      draggable: true, // Make marker draggable
    }).addTo(map);

    userMarker.bindPopup(`
      <div style="padding: 8px;">
        <h3 style="font-weight: bold; margin-bottom: 4px;">📍 Your Location</h3>
        <p style="font-size: 12px; color: #666;">
          Lat: ${userLocation.lat.toFixed(4)}<br>
          Lng: ${userLocation.lng.toFixed(4)}
        </p>
        <p style="font-size: 11px; color: #888; margin-top: 4px;">
          💡 Drag me to update location
        </p>
      </div>
    `);

    // Handle marker drag to update location
    userMarker.on('dragend', () => {
      const position = userMarker.getLatLng();
      if (onLocationChange) {
        onLocationChange({ lat: position.lat, lng: position.lng });
      }
    });

    userMarkerRef.current = userMarker;
    mapRef.current = map;

    // Handle map click to set location
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isSettingLocation && onLocationChange) {
        const { lat, lng } = e.latlng;
        onLocationChange({ lat, lng });
        
        // Update marker position
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng]);
          userMarkerRef.current.bindPopup(`
            <div style="padding: 8px;">
              <h3 style="font-weight: bold; margin-bottom: 4px;">📍 Your Location</h3>
              <p style="font-size: 12px; color: #666;">
                Lat: ${lat.toFixed(4)}<br>
                Lng: ${lng.toFixed(4)}
              </p>
              <p style="font-size: 11px; color: #888; margin-top: 4px;">
                💡 Drag me to update location
              </p>
            </div>
          `).openPopup();
        }
        
        setIsSettingLocation(false);
      }
    });

    // Add farmer markers
    addFarmerMarkers(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userLocation]);

  // Update farmer markers when farmers change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    addFarmerMarkers(mapRef.current);
  }, [farmers]);

  const addFarmerMarkers = (map: L.Map) => {
    console.log(`🗺️ Adding ${farmers.length} farmers to map`);
    
    farmers.forEach((farmer) => {
      if (!farmer.location) {
        console.log(`⚠️ Farmer ${farmer.name} has no location`);
        return;
      }

      const location = farmer.location;
      if (
        !location ||
        typeof location.lat !== "number" ||
        typeof location.lng !== "number"
      ) {
        console.warn(`❌ Invalid location for farmer ${farmer.name}:`, location);
        return;
      }
      
      console.log(`✅ Adding marker for ${farmer.name} at`, location);

      // Create custom green marker
      const farmerIcon = L.divIcon({
        className: "custom-farmer-marker",
        html: `<div style="
          background-color: #22c55e;
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          transform: rotate(-45deg);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            font-size: 16px;
            color: white;
          ">🌾</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([location.lat, location.lng], {
        icon: farmerIcon,
      }).addTo(map);

      // Create popup content
      const popupContent = `
        <div style="padding: 12px; max-width: 250px;">
          <h3 style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">🌾 ${farmer.name}</h3>
          ${
            farmer.location?.address
              ? `<p style="font-size: 11px; color: #666; margin-bottom: 4px;">📫 ${farmer.location.address}</p>`
              : ""
          }
          ${
            farmer.distance !== undefined
              ? `<p style="font-size: 12px; color: #0066cc; margin-bottom: 4px;">📍 ${farmer.distance.toFixed(1)} km away</p>`
              : ""
          }
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">📦 ${farmer.products.length} products available</p>
          ${
            farmer.products.length > 0
              ? `
            <div style="margin-bottom: 8px;">
              <p style="font-size: 11px; color: #888; margin-bottom: 4px;">Top Products:</p>
              ${farmer.products
                .slice(0, 3)
                .map(
                  (p) =>
                    `<span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin: 2px;">${p.name}</span>`
                )
                .join("")}
            </div>
          `
              : ""
          }
          <a 
            href="/dashboard/user?farmerId=${farmer.id}"
            style="display: block; background: #22c55e; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; width: 100%; font-size: 12px; font-weight: 500; text-align: center; text-decoration: none;"
          >
            View Products
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onFarmerClick(farmer);
      });

      markersRef.current.push(marker);

      // Draw line from user to farmer
      if (userLocation && location) {
        try {
          const line = L.polyline(
            [
              [userLocation.lat, userLocation.lng],
              [location.lat, location.lng],
            ],
            {
              color: "#22c55e",
              weight: 2,
              opacity: 0.4,
              dashArray: "5, 10",
            }
          ).addTo(map);

          markersRef.current.push(line);
        } catch (error) {
          console.warn("Failed to draw line for farmer:", farmer.name, error);
        }
      }
    });
  };

  return (
    <div className="relative w-full h-full">
      <div id="leaflet-map" className="w-full h-full" />

      {/* Set Location Button */}
      {onLocationChange && (
        <div className="absolute top-4 left-4 z-[1000]">
          <button
            onClick={() => setIsSettingLocation(!isSettingLocation)}
            className={`px-4 py-2 rounded-lg shadow-lg font-medium transition-all ${
              isSettingLocation
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isSettingLocation ? (
              <>
                <span className="inline-block animate-pulse">📍</span> Click map to set location
              </>
            ) : (
              <>📍 Set My Location</>
            )}
          </button>
          {isSettingLocation && (
            <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800 max-w-xs">
              <strong>Setting Location Mode:</strong><br/>
              Click anywhere on the map to set your location
            </div>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-[1000]">
        <h3 className="font-bold text-sm mb-2">Map Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Your Location (drag to move)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Farmer Location</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-green-400"></div>
            <span>Distance Line</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs z-[1000]">
        <p className="text-xs text-gray-600">
          💡 <strong>Tip:</strong> Click on green markers to see farmer details.
          {onLocationChange && (
            <>
              <br/>
              <strong>Drag your blue marker</strong> or use "Set My Location" button to change your position.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
