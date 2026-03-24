import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, AlertTriangle, Hospital, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const hospitalIcon = L.divIcon({
  className: 'custom-hospital-icon',
  html: `<div style="background-color:#ef4444;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3)"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const userIcon = L.divIcon({
  className: 'custom-user-icon',
  html: `<div style="background-color:#3b82f6;width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px #3b82f640,0 2px 5px rgba(0,0,0,0.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Multiple fallback Overpass servers — tried in order until one succeeds
const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
];

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface HospitalData {
  id: number;
  lat: number;
  lon: number;
  name: string;
  distance: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function HospitalFinder() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5000);
  const locationRef = useRef<[number, number] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initRef = useRef(false);

  const fetchNearbyHospitals = useCallback(async (lat: number, lon: number, searchRadius: number) => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const query = `[out:json][timeout:20];(node["amenity"="hospital"](around:${searchRadius},${lat},${lon});way["amenity"="hospital"](around:${searchRadius},${lat},${lon});node["amenity"="clinic"](around:${searchRadius},${lat},${lon});way["amenity"="clinic"](around:${searchRadius},${lat},${lon}););out center;`;

    // Try each Overpass server in sequence until one works
    let lastError: Error | null = null;
    for (const server of OVERPASS_SERVERS) {
      if (controller.signal.aborted) return;
      try {
        const response = await fetch(server, {
          method: 'POST',
          body: query,
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        const data = await response.json();

        const parsed: HospitalData[] = data.elements
          .map((el: any) => {
            const hLat = el.lat || el.center?.lat;
            const hLon = el.lon || el.center?.lon;
            return {
              id: el.id,
              lat: hLat,
              lon: hLon,
              name: el.tags?.name || 'Unnamed Medical Facility',
              distance: calculateDistance(lat, lon, hLat, hLon),
            };
          })
          .filter((h: HospitalData) => h.lat && h.lon)
          .sort((a: HospitalData, b: HospitalData) => a.distance - b.distance)
          .slice(0, 10);

        setHospitals(parsed);
        setLoading(false);
        return; // success — stop trying servers
      } catch (err: any) {
        if (err.name === 'AbortError') return; // request was cancelled, stop silently
        lastError = err;
        // try next server
      }
    }

    // All servers failed
    setError('All map servers are busy right now. Please tap Retry in a moment.');
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        setLocation(coords);
        locationRef.current = coords;
        fetchNearbyHospitals(coords[0], coords[1], 5000);
      },
      () => {
        setError('Unable to get your location. Please allow location access and try again.');
        setLoading(false);
      },
      { timeout: 10000 }
    );

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchNearbyHospitals]);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (locationRef.current) {
      fetchNearbyHospitals(locationRef.current[0], locationRef.current[1], newRadius);
    }
  };

  const handleRetry = () => {
    if (locationRef.current) {
      fetchNearbyHospitals(locationRef.current[0], locationRef.current[1], radius);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-white">
      <Navbar />

      {/* Radius selector — full width bar, always visible on all screen sizes */}
      <div className="bg-black/60 backdrop-blur-xl border-b border-white/10 px-4 py-3 z-40">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          <span className="text-xs text-white/50 font-medium uppercase tracking-wider shrink-0">
            Search radius:
          </span>
          <div className="flex gap-2 flex-wrap">
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRadiusChange(opt.value)}
                disabled={loading}
                className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 ${
                  radius === opt.value
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-white/50 ml-auto shrink-0" />
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto overflow-hidden relative">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-full max-w-[600px] h-[400px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Sidebar */}
        <div className="w-full md:w-80 bg-[#0a0a0a] border-r border-white/10 flex flex-col shrink-0 h-[35vh] md:h-[calc(100vh-120px)] overflow-y-auto relative z-10">
          <div className="p-4 border-b border-white/10 sticky top-0 bg-[#0a0a0a] z-10">
            <h2 className="text-lg font-serif text-white">Places to Get Help</h2>
            <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Close to you</p>
          </div>

          <div className="p-4 pb-28 md:pb-4 flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 text-white/80">
                <Loader2 className="w-7 h-7 animate-spin text-white mb-3" />
                <p className="font-light text-sm text-center">Searching for hospitals nearby...</p>
              </div>
            ) : error ? (
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-light leading-relaxed">{error}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-medium text-white transition-all active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </button>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="text-center py-10 text-white/80">
                <Hospital className="w-10 h-10 mx-auto text-white/30 mb-3" />
                <p className="font-light text-sm">No hospitals found in this radius.</p>
                <p className="text-white/40 text-xs mt-1">Try a larger search radius above.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {hospitals.map((hospital) => (
                  <motion.li
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={hospital.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-blue-500/40 hover:bg-white/8 transition-all group"
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm text-white leading-snug mb-1">
                          {hospital.name}
                        </h3>
                        <p className="text-xs text-white/60 flex items-center gap-1 font-light">
                          <MapPin className="w-3 h-3 text-white/40 shrink-0" />
                          {hospital.distance.toFixed(1)} km away
                        </p>
                      </div>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 bg-white/10 text-white border border-white/20 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all"
                        title="Directions"
                      >
                        <Navigation className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative h-[calc(65vh-56px)] md:h-[calc(100vh-120px)] z-0">
          {location ? (
            <MapContainer
              center={location}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              className="z-0"
            >
              <ChangeView center={location} zoom={13} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />
              <Marker position={location} icon={userIcon}>
                <Popup>
                  <div className="text-black font-medium text-sm">You are here</div>
                </Popup>
              </Marker>
              {hospitals.map((hospital) => (
                <Marker key={hospital.id} position={[hospital.lat, hospital.lon]} icon={hospitalIcon}>
                  <Popup>
                    <div className="font-bold text-black mb-1 text-sm">{hospital.name}</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {hospital.distance.toFixed(1)} km away
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider"
                    >
                      Take Me There →
                    </a>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : !error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-10">
              <div className="bg-white/10 border border-white/20 p-8 rounded-[2rem] shadow-2xl text-center max-w-sm mx-4 backdrop-blur-xl">
                <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-8 h-8 text-blue-400 animate-bounce" />
                </div>
                <h3 className="text-xl font-serif text-white mb-3">Finding Where You Are...</h3>
                <p className="text-white/60 text-sm font-light leading-relaxed">
                  Please allow location access when your browser asks.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
