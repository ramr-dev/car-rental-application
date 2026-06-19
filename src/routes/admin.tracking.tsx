import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useMemo } from "react";
import { gpsService, type VehicleLocation } from "@/lib/api/gps.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Navigation,
  Wifi,
  WifiOff,
  Search,
  RefreshCw,
  Car,
  Satellite,
  Clock,
} from "lucide-react";

// Leaflet imports — CSS is loaded dynamically to avoid SSR issues
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

export const Route = createFileRoute("/admin/tracking")({
  component: AdminTracking,
});

// ── Custom map icons ──────────────────────────────────────────────────────

function createCarIcon(status: "online" | "offline") {
  return L.divIcon({
    className: "custom-car-marker",
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: ${status === "online" ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #6b7280, #4b5563)"};
        box-shadow: 0 2px 8px ${status === "online" ? "rgba(34,197,94,0.5)" : "rgba(107,114,128,0.4)"};
        border: 3px solid white;
        position: relative;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
      ${status === "online" ? '<div style="position:absolute; top:-2px; right:-2px; width:12px; height:12px; background:#22c55e; border-radius:50%; border:2px solid white; animation: pulse 2s infinite;"></div>' : ""}
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ── Auto-fit map bounds when data changes ─────────────────────────────────

function MapBoundsUpdater({ locations }: { locations: VehicleLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(
      locations.map((loc) => [loc.latitude, loc.longitude] as L.LatLngTuple)
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [locations, map]);

  return null;
}

// ── Time ago helper ───────────────────────────────────────────────────────

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Main Component ────────────────────────────────────────────────────────

function AdminTracking() {
  const [search, setSearch] = useState("");
  const [leafletCssLoaded, setLeafletCssLoaded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  // Load Leaflet CSS dynamically (avoids SSR issues)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const existingLink = document.querySelector('link[href*="leaflet"]');
    if (existingLink) {
      setLeafletCssLoaded(true);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.onload = () => setLeafletCssLoaded(true);
    document.head.appendChild(link);

    // Add pulse animation CSS
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.7; }
        100% { transform: scale(1); opacity: 1; }
      }
      .custom-car-marker { background: none !important; border: none !important; }
      .leaflet-popup-content-wrapper {
        border-radius: 12px !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Fetch GPS data with auto-refresh every 10 seconds
  const { data: locations = [], isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["gps-locations"],
    queryFn: gpsService.getLocations,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  // Filter locations by search
  const filtered = useMemo(() => {
    if (!search.trim()) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.id.toString().includes(q)
    );
  }, [locations, search]);

  // Stats
  const onlineCount = locations.filter((v) => v.status === "online").length;
  const offlineCount = locations.filter((v) => v.status === "offline").length;

  // Center map on a specific vehicle
  const focusVehicle = (loc: VehicleLocation) => {
    if (mapRef.current) {
      mapRef.current.flyTo([loc.latitude, loc.longitude], 15, { duration: 1 });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Satellite className="h-6 w-6 text-primary" />
            Live Vehicle Tracking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time GPS positions of your fleet on the map
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1.5 py-1">
            <Clock className="h-3.5 w-3.5" />
            {dataUpdatedAt
              ? `Updated ${timeAgo(new Date(dataUpdatedAt).toISOString())}`
              : "Loading..."}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Car className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tracked</p>
              <p className="text-2xl font-bold">{locations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
              <Wifi className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Online</p>
              <p className="text-2xl font-bold text-green-500">{onlineCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-500/10">
              <WifiOff className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Offline</p>
              <p className="text-2xl font-bold text-gray-500">
                {offlineCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {/* Sidebar — Vehicle List */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Vehicles
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vehicles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 animate-pulse rounded-lg bg-muted"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
                  <MapPin className="h-8 w-8 opacity-50" />
                  <p className="text-sm">
                    {search
                      ? "No vehicles match your search"
                      : "No GPS data yet. Start the simulator!"}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => focusVehicle(vehicle)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full ${
                          vehicle.status === "online"
                            ? "bg-green-500/15 text-green-500"
                            : "bg-gray-500/15 text-gray-500"
                        }`}
                      >
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {vehicle.brand} {vehicle.model}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {vehicle.name} • ID: {vehicle.id}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            vehicle.status === "online"
                              ? "default"
                              : "secondary"
                          }
                          className={`text-[10px] px-1.5 py-0 ${
                            vehicle.status === "online"
                              ? "bg-green-500 hover:bg-green-600"
                              : ""
                          }`}
                        >
                          {vehicle.status === "online" ? (
                            <Wifi className="h-3 w-3 mr-0.5" />
                          ) : (
                            <WifiOff className="h-3 w-3 mr-0.5" />
                          )}
                          {vehicle.status}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {timeAgo(vehicle.lastSeen)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3 order-1 lg:order-2 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[600px] w-full relative">
              {!leafletCssLoaded ? (
                <div className="flex h-full items-center justify-center bg-muted/30">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Loading map...
                    </p>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={[20.5937, 78.9629]}
                  zoom={5}
                  className="h-full w-full z-0"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapBoundsUpdater locations={filtered} />
                  {filtered.map((vehicle) => (
                    <Marker
                      key={vehicle.id}
                      position={[vehicle.latitude, vehicle.longitude]}
                      icon={createCarIcon(vehicle.status)}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={`h-2.5 w-2.5 rounded-full ${
                                vehicle.status === "online"
                                  ? "bg-green-500"
                                  : "bg-gray-400"
                              }`}
                            />
                            <span className="font-semibold text-sm">
                              {vehicle.brand} {vehicle.model}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Vehicle:</span>
                              <span className="font-medium">{vehicle.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>ID:</span>
                              <span className="font-medium">#{vehicle.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <span
                                className={`font-medium ${
                                  vehicle.status === "online"
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {vehicle.status === "online"
                                  ? "🟢 Online"
                                  : "🔴 Offline"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Last seen:</span>
                              <span className="font-medium">
                                {timeAgo(vehicle.lastSeen)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Coordinates:</span>
                              <span className="font-medium font-mono text-[10px]">
                                {vehicle.latitude.toFixed(4)},{" "}
                                {vehicle.longitude.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
