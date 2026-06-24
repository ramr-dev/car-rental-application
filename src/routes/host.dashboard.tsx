import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  BarChart3, Car, Calendar, DollarSign, ClipboardCheck,
  MapPin, Plus, Loader2, ShieldCheck, AlertCircle, Clock,
  Compass, Eye, Check, Banknote, ListFilter, Camera,
  FileCheck, Shield, ToggleLeft, ToggleRight, Settings, Info,
  MapIcon
} from "lucide-react";

// Leaflet setup (Client-only to prevent SSR errors)
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useAuth } from "@/store/auth";
import { hostService, HostSubmitVehicleInput } from "@/lib/api/host.service";
import { bookingService } from "@/lib/api/booking.service";
import { userService } from "@/lib/api/user.service";

export const Route = createFileRoute("/host/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("drivelux-auth");
      const user = raw ? JSON.parse(raw)?.state?.user : null;
      if (!user) {
        throw redirect({ to: "/login", search: { redirect: "/host/dashboard" } });
      }
      // If not registered as host, redirect to onboarding wizard
      if (user.role !== "host" && user.hostStatus !== "VERIFIED") {
        throw redirect({ to: "/host/register" });
      }
    }
  },
  component: HostDashboardPage,
});

// Custom map icon helper
function createCarIcon(status: "online" | "offline") {
  if (typeof window === "undefined") return null;
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
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.3 1 12.1 1 13v3c0 .6.4 1 1 1h2"/>
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

function HostDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Dialog open state
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // Selected entities
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [checklistType, setChecklistType] = useState<"CHECK_IN" | "CHECK_OUT">("CHECK_IN");

  // Map state
  const [leafletCssLoaded, setLeafletCssLoaded] = useState(false);
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState<any | null>(null);
  const [simulatedLoc, setSimulatedLoc] = useState<[number, number]>([12.9716, 77.5946]); // default Bangalore

  // File Upload states for Car listing
  const [carImage, setCarImage] = useState("");
  const [rcUrl, setRcUrl] = useState("");
  const [insuranceUrl, setInsuranceUrl] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fileInputRefs = {
    image: useRef<HTMLInputElement>(null),
    rc: useRef<HTMLInputElement>(null),
    insurance: useRef<HTMLInputElement>(null),
  };

  // Checklist Form values
  const [checklistForm, setChecklistForm] = useState({
    odometerReading: "",
    fuelLevel: "100",
    damageNotes: "",
    images: [] as string[],
  });
  const [uploadingChecklistPhoto, setUploadingChecklistPhoto] = useState(false);
  const checklistPhotoRef = useRef<HTMLInputElement>(null);

  // Schedule Form
  const [scheduleForm, setScheduleForm] = useState({
    startDate: "",
    endDate: "",
  });

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
    `;
    document.head.appendChild(style);
  }, []);

  // Update mock coordinates when active booking tracking is selected
  useEffect(() => {
    if (!selectedTrackingBooking) return;
    
    // Simulate slight movements
    setSimulatedLoc([12.9716, 77.5946]);
    const timer = setInterval(() => {
      setSimulatedLoc((prev) => [
        prev[0] + (Math.random() - 0.5) * 0.002,
        prev[1] + (Math.random() - 0.5) * 0.002,
      ]);
    }, 4000);
    return () => clearInterval(timer);
  }, [selectedTrackingBooking]);

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["host-stats"],
    queryFn: () => hostService.getStats(),
    enabled: !!user,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["host-vehicles"],
    queryFn: () => hostService.listVehicles(),
    enabled: !!user,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["host-bookings"],
    queryFn: () => bookingService.list({ asHost: true }),
    enabled: !!user,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ["host-payouts"],
    queryFn: () => hostService.listPayouts(),
    enabled: !!user,
  });

  // Fetch schedules for selected vehicle
  const { data: schedules = [] } = useQuery({
    queryKey: ["vehicle-schedules", selectedVehicleId],
    queryFn: () => hostService.getSchedules(selectedVehicleId!),
    enabled: selectedVehicleId !== null,
  });

  // Mutations
  const createVehicleMutation = useMutation({
    mutationFn: (data: HostSubmitVehicleInput) => hostService.submitVehicle(data),
    onSuccess: () => {
      toast.success("Car listing submitted! Admin review pending.");
      queryClient.invalidateQueries({ queryKey: ["host-vehicles"] });
      setIsListingModalOpen(false);
      // Reset form variables
      setCarImage("");
      setRcUrl("");
      setInsuranceUrl("");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Failed to list car.";
      toast.error(msg);
    }
  });

  const addScheduleMutation = useMutation({
    mutationFn: (data: { vehicleId: number; startDate: string; endDate: string }) =>
      hostService.addSchedule(data),
    onSuccess: () => {
      toast.success("Availability schedule added successfully!");
      queryClient.invalidateQueries({ queryKey: ["vehicle-schedules", selectedVehicleId] });
      setScheduleForm({ startDate: "", endDate: "" });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Failed to add availability slot.";
      toast.error(msg);
    }
  });

  const submitChecklistMutation = useMutation({
    mutationFn: (data: any) => hostService.submitChecklist(data),
    onSuccess: () => {
      toast.success(`${checklistType === "CHECK_IN" ? "Check-in" : "Check-out"} checklist saved!`);
      queryClient.invalidateQueries({ queryKey: ["host-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["host-stats"] });
      setIsChecklistModalOpen(false);
      setChecklistForm({ odometerReading: "", fuelLevel: "100", damageNotes: "", images: [] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? "Failed to submit report.";
      toast.error(msg);
    }
  });

  // Handle document upload
  const uploadDoc = async (file: File, field: "image" | "rc" | "insurance") => {
    setUploadingField(field);
    try {
      const res = await userService.uploadKycFile(file);
      if (field === "image") setCarImage(res.url);
      else if (field === "rc") setRcUrl(res.url);
      else if (field === "insurance") setInsuranceUrl(res.url);
      toast.success("File uploaded successfully.");
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  const uploadChecklistPhoto = async (file: File) => {
    setUploadingChecklistPhoto(true);
    try {
      const res = await userService.uploadKycFile(file);
      setChecklistForm(prev => ({
        ...prev,
        images: [...prev.images, res.url]
      }));
      toast.success("Inspection photo uploaded!");
    } catch {
      toast.error("Photo upload failed.");
    } finally {
      setUploadingChecklistPhoto(false);
    }
  };

  // Car Listing form react-hook-form
  const { register: registerCar, handleSubmit: handleSubmitCar, reset: resetCarForm } = useForm<Omit<HostSubmitVehicleInput, "image"|"rcUrl"|"insuranceUrl"|"images">>();

  const onListCar = (data: any) => {
    if (!carImage || !rcUrl || !insuranceUrl) {
      toast.error("Please upload the main photo, RC book copy, and Insurance copy.");
      return;
    }

    createVehicleMutation.mutate({
      ...data,
      year: Number(data.year),
      seats: Number(data.seats),
      pricePerDay: Number(data.pricePerDay),
      image: carImage,
      rcUrl: rcUrl,
      insuranceUrl: insuranceUrl,
      images: [carImage], // default sub images
      features: data.features ? data.features.split(",").map((f: string) => f.trim()) : [],
    });
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-4rem)] bg-muted/20 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Host Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your shared vehicles, schedule availability calendars, and track payouts.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Dialog open={isListingModalOpen} onOpenChange={setIsListingModalOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-soft bg-gradient-hero text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" /> List a New Car
                  </Button>
                </DialogTrigger>
                
                {/* LISTING FORM MODAL */}
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <form onSubmit={handleSubmitCar(onListCar)}>
                    <DialogHeader>
                      <DialogTitle className="font-display text-xl font-bold">List a New Car</DialogTitle>
                      <DialogDescription>
                        Complete documentation and registration files to list your vehicle.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label>Vehicle Display Name</Label>
                        <Input placeholder="e.g. Maruti Suzuki Swift / Ford Mustang" {...registerCar("name", { required: true })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Brand</Label>
                        <Input placeholder="e.g. Maruti, Hyundai, BMW" {...registerCar("brand", { required: true })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Model</Label>
                        <Input placeholder="e.g. Swift, Creta, 3 Series" {...registerCar("model", { required: true })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Model Year</Label>
                        <Input type="number" placeholder="2022" {...registerCar("year", { required: true })} />
                      </div>
                      <div className="space-y-1">
                        <Label>Seats</Label>
                        <Input type="number" placeholder="5" defaultValue="5" {...registerCar("seats", { required: true })} />
                      </div>

                      <div className="space-y-1">
                        <Label>Body Type</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...registerCar("type", { required: true })}>
                          <option value="SEDAN">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="LUXURY">Luxury</option>
                          <option value="ELECTRIC">Electric</option>
                          <option value="CONVERTIBLE">Convertible</option>
                          <option value="VAN">Van</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Fuel Type</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...registerCar("fuel", { required: true })}>
                          <option value="PETROL">Petrol</option>
                          <option value="DIESEL">Diesel</option>
                          <option value="ELECTRIC">Electric</option>
                          <option value="HYBRID">Hybrid</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Transmission</Label>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...registerCar("transmission", { required: true })}>
                          <option value="AUTOMATIC">Automatic</option>
                          <option value="MANUAL">Manual</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label>Rental Rate per Day (₹)</Label>
                        <Input type="number" placeholder="3000" {...registerCar("pricePerDay", { required: true })} />
                      </div>
                      
                      <div className="space-y-1 sm:col-span-2">
                        <Label>Pickup Location (Designated Area)</Label>
                        <Input placeholder="e.g. Indiranagar, Bangalore" {...registerCar("location", { required: true })} />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label>Features (comma separated list)</Label>
                        <Input placeholder="e.g. Air Conditioning, Sunroof, Android Auto, Airbags" {...registerCar("features")} />
                      </div>

                      <div className="space-y-1">
                        <Label>Mileage (e.g. 15 kmpl)</Label>
                        <Input placeholder="15 kmpl" {...registerCar("mileage")} />
                      </div>
                      <div className="space-y-1">
                        <Label>Engine CC (e.g. 1498 cc)</Label>
                        <Input placeholder="1200 cc" {...registerCar("engine")} />
                      </div>
                      <div className="space-y-1">
                        <Label>Top Speed (km/h)</Label>
                        <Input placeholder="180 km/h" {...registerCar("topSpeed")} />
                      </div>
                      <div className="space-y-1">
                        <Label>0-100 km/h Acceleration (seconds)</Label>
                        <Input placeholder="10.5s" {...registerCar("acceleration")} />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <Label>Car Description</Label>
                        <Textarea placeholder="Describe your vehicle, details, guidelines..." {...registerCar("description")} />
                      </div>

                      <div className="space-y-1 sm:col-span-2 border-t pt-4 mt-2">
                        <h4 className="text-sm font-semibold mb-2">Registration & Identity Documents</h4>
                      </div>

                      <div className="space-y-1">
                        <Label>Registration Plate Number</Label>
                        <Input placeholder="KA03MX1234" className="uppercase font-mono" {...registerCar("registrationNumber", { required: true })} />
                      </div>

                      {/* Main Photo Upload */}
                      <div className="space-y-1">
                        <Label>Car Main Photo</Label>
                        <input type="file" ref={fileInputRefs.image} className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "image")} />
                        <Button type="button" variant="outline" className="w-full flex items-center justify-center border-dashed" onClick={() => fileInputRefs.image.current?.click()} disabled={uploadingField !== null}>
                          {uploadingField === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : carImage ? "✓ Photo Attached" : "Upload Car Photo"}
                        </Button>
                      </div>

                      {/* RC Copy Upload */}
                      <div className="space-y-1">
                        <Label>RC (Registration Certificate) Document</Label>
                        <input type="file" ref={fileInputRefs.rc} className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "rc")} />
                        <Button type="button" variant="outline" className="w-full flex items-center justify-center border-dashed" onClick={() => fileInputRefs.rc.current?.click()} disabled={uploadingField !== null}>
                          {uploadingField === "rc" ? <Loader2 className="h-4 w-4 animate-spin" /> : rcUrl ? "✓ RC Book Attached" : "Upload RC Copy"}
                        </Button>
                      </div>

                      {/* Insurance Copy Upload */}
                      <div className="space-y-1">
                        <Label>Insurance Policy Document</Label>
                        <input type="file" ref={fileInputRefs.insurance} className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && uploadDoc(e.target.files[0], "insurance")} />
                        <Button type="button" variant="outline" className="w-full flex items-center justify-center border-dashed" onClick={() => fileInputRefs.insurance.current?.click()} disabled={uploadingField !== null}>
                          {uploadingField === "insurance" ? <Loader2 className="h-4 w-4 animate-spin" /> : insuranceUrl ? "✓ Insurance Attached" : "Upload Insurance Copy"}
                        </Button>
                      </div>

                    </div>
                    <DialogFooter className="mt-4">
                      <Button type="button" variant="outline" onClick={() => setIsListingModalOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createVehicleMutation.isPending}>
                        {createVehicleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Listing"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 space-y-6">
            <TabsList className="bg-card border w-full justify-start p-1 h-auto flex-wrap gap-1">
              <TabsTrigger value="overview" className="flex items-center gap-2 py-2 px-3">
                <BarChart3 className="h-4 w-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="flex items-center gap-2 py-2 px-3">
                <Car className="h-4 w-4" /> My Vehicles
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex items-center gap-2 py-2 px-3">
                <ClipboardCheck className="h-4 w-4" /> Rent Bookings
              </TabsTrigger>
              <TabsTrigger value="gps" className="flex items-center gap-2 py-2 px-3">
                <Compass className="h-4 w-4" /> Live GPS Tracking
              </TabsTrigger>
              <TabsTrigger value="payouts" className="flex items-center gap-2 py-2 px-3">
                <Banknote className="h-4 w-4" /> Payouts Ledger
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">₹{(stats?.grossEarnings ?? 0).toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Total revenue generated from rentals</p>
                  </CardContent>
                </Card>

                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Net Host Earnings</CardTitle>
                    <Banknote className="h-4 w-4 text-emerald-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{(stats?.netEarnings ?? 0).toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Your 85% share deposited to bank</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Platform Commission</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">₹{(stats?.platformCommission ?? 0).toLocaleString()}</div>
                    <p className="text-[10px] text-muted-foreground mt-1">Fixed 15% DriveLux service fee</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trips & Listings</CardTitle>
                    <Car className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats?.totalTrips ?? 0} Trips</div>
                    <p className="text-[10px] text-muted-foreground mt-1">{stats?.activeListings ?? 0} active vehicle listings</p>
                  </CardContent>
                </Card>
              </div>

              {/* Commission Alert Panel */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" /> Verified P2P Marketplace Member
                  </h3>
                  <p className="text-xs text-muted-foreground leading-normal">
                    DriveLux operates on a flat commission split rate. Hosts receive direct deposit payouts of 85% on completed rentals, while the remaining 15% platform commission covers secure payment processing, full insurance coverage checks, and real-time active GPS tracker integrations.
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 px-3 py-1 font-mono text-xs border-primary/30 text-primary">
                  15% Split Rate
                </Badge>
              </div>

              {/* Active Bookings Warning */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-display">Active Vehicles</CardTitle>
                    <CardDescription>Overview of listed assets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vehicles.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No cars listed yet.</p>
                    ) : (
                      vehicles.slice(0, 3).map((v) => (
                        <div key={v.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <img src={v.image} alt={v.name} className="h-10 w-16 object-cover rounded-lg border" />
                            <div>
                              <p className="text-xs font-semibold">{v.brand} {v.model}</p>
                              <p className="text-[10px] text-muted-foreground">{v.location} · ₹{v.pricePerDay}/day</p>
                            </div>
                          </div>
                          <Badge variant={v.isApproved ? "outline" : "secondary"} className={v.isApproved ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : "text-amber-500 bg-amber-500/5"}>
                            {v.isApproved ? "Approved" : "Pending Audit"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-display">Active Bookings Checklist Queue</CardTitle>
                    <CardDescription>Actions needed for rentals starting or ending today</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bookings.filter((b: any) => b.status === "confirmed" || b.status === "active").length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">No pending handovers/returns today.</p>
                    ) : (
                      bookings
                        .filter((b: any) => b.status === "confirmed" || b.status === "active")
                        .slice(0, 3)
                        .map((b: any) => (
                          <div key={b.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div>
                              <p className="text-xs font-semibold">{b.vehicleName}</p>
                              <p className="text-[10px] text-muted-foreground">Guest: {b.customerName} · Booking ID: {b.id}</p>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2.5" onClick={() => {
                              setSelectedBooking(b);
                              setChecklistType(b.status === "confirmed" ? "CHECK_IN" : "CHECK_OUT");
                              setIsChecklistModalOpen(true);
                            }}>
                              {b.status === "confirmed" ? "Handover Check-in" : "Return Check-out"}
                            </Button>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* VEHICLES TAB */}
            <TabsContent value="vehicles" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {vehicles.map((v) => (
                  <Card key={v.id} className="overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="relative h-48 bg-muted">
                        <img src={v.image} alt={v.name} className="h-full w-full object-cover" />
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <Badge variant={v.isApproved ? "default" : "secondary"} className={v.isApproved ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}>
                            {v.isApproved ? "Approved" : "Pending Audit"}
                          </Badge>
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="font-display font-bold text-lg">{v.brand} {v.model}</CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <MapPin className="h-3 w-3 shrink-0" /> {v.location}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-xs border-b pb-2">
                          <span className="text-muted-foreground">Plate Registration:</span>
                          <span className="font-mono font-semibold uppercase">{v.registrationNumber ?? "N/A"}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs border-b pb-2">
                          <span className="text-muted-foreground">Daily Rate:</span>
                          <span className="font-semibold text-primary">₹{v.pricePerDay} / day</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Listing Visibility:</span>
                          <Badge variant={v.available ? "outline" : "secondary"} className={v.available ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" : ""}>
                            {v.available ? "Listed & Searchable" : "Hidden / Inactive"}
                          </Badge>
                        </div>
                      </CardContent>
                    </div>

                    <CardFooter className="bg-muted/10 border-t p-4 flex gap-2">
                      <Button variant="outline" className="flex-1 text-xs" onClick={() => {
                        setSelectedVehicleId(Number(v.id));
                        setIsScheduleModalOpen(true);
                      }}>
                        <Calendar className="h-3.5 w-3.5 mr-1.5" /> Manage Calendar
                      </Button>
                      <Button variant="ghost" asChild className="flex-1 text-xs">
                        <Link to="/vehicles/$id" params={{ id: String(v.id) }}>
                          <Eye className="h-3.5 w-3.5 mr-1.5" /> View Listing
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
                
                {vehicles.length === 0 && (
                  <Card className="md:col-span-2 border-dashed flex flex-col items-center justify-center p-12 text-center">
                    <Car className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-display font-bold text-lg">No vehicles listed</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      Submit details of your personal vehicle, uploads of identity registration files and license plates to start hosting.
                    </p>
                    <Button className="mt-4" onClick={() => setIsListingModalOpen(true)}>
                      List your first car
                    </Button>
                  </Card>
                )}
              </div>

              {/* SCHEDULE MODAL */}
              <Dialog open={isScheduleModalOpen} onOpenChange={(open) => {
                setIsScheduleModalOpen(open);
                if (!open) setSelectedVehicleId(null);
              }}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold">Manage Availability Schedules</DialogTitle>
                    <DialogDescription>
                      Add date windows when your car is active for bookings on DriveLux.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="datetime-local"
                          value={scheduleForm.startDate}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="datetime-local"
                          value={scheduleForm.endDate}
                          onChange={(e) => setScheduleForm(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (!scheduleForm.startDate || !scheduleForm.endDate) {
                          toast.error("Please enter both start and end times.");
                          return;
                        }
                        addScheduleMutation.mutate({
                          vehicleId: selectedVehicleId!,
                          startDate: scheduleForm.startDate,
                          endDate: scheduleForm.endDate,
                        });
                      }}
                      className="w-full"
                      disabled={addScheduleMutation.isPending}
                    >
                      {addScheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Add Availability Slot"}
                    </Button>

                    <div className="border-t pt-4 mt-2">
                      <h4 className="text-sm font-semibold mb-2">Existing Slots</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {schedules.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No schedules defined yet. The car is currently unavailable.</p>
                        ) : (
                          schedules.map((s: any) => (
                            <div key={s.id} className="flex justify-between items-center p-2 rounded-lg border text-xs bg-muted/20">
                              <div>
                                <span className="font-medium">From:</span> {new Date(s.startDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                                <br />
                                <span className="font-medium">To:</span> {new Date(s.endDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setIsScheduleModalOpen(false)}>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* BOOKINGS & CHECKLISTS TAB */}
            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg font-bold">P2P Rent Bookings</CardTitle>
                  <CardDescription>Monitor guest bookings, and submit pre/post-trip checklist reports.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking ID</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Dates</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Payout (85%)</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bookings.map((b: any) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-mono text-xs">{b.id}</TableCell>
                            <TableCell className="font-medium">{b.vehicleName}</TableCell>
                            <TableCell className="text-xs">
                              {b.startDate.replace("T", " ")} to {b.endDate.replace("T", " ")}
                            </TableCell>
                            <TableCell className="text-xs">
                              {b.customerName}
                              <br />
                              <span className="text-[10px] text-muted-foreground">{b.customerPhone}</span>
                            </TableCell>
                            <TableCell className="font-semibold text-emerald-600">
                              ₹{(b.totalPrice * 0.85).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`font-semibold capitalize ${
                                b.status === "confirmed" ? "border-sky-500/30 text-sky-500 bg-sky-500/5" :
                                b.status === "active" ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/5" :
                                b.status === "completed" ? "border-neutral-500/30 text-neutral-500" : "border-destructive/30 text-destructive bg-destructive/5"
                              }`}>
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {b.status === "confirmed" && (
                                <Button size="sm" className="h-8 text-xs" onClick={() => {
                                  setSelectedBooking(b);
                                  setChecklistType("CHECK_IN");
                                  setIsChecklistModalOpen(true);
                                }}>
                                  Handover Checklist
                                </Button>
                              )}
                              {b.status === "active" && (
                                <Button size="sm" className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-white" onClick={() => {
                                  setSelectedBooking(b);
                                  setChecklistType("CHECK_OUT");
                                  setIsChecklistModalOpen(true);
                                }}>
                                  Return Checklist
                                </Button>
                              )}
                              {b.status === "completed" && (
                                <span className="text-xs text-muted-foreground italic flex items-center justify-end gap-1">
                                  <Check className="h-4.5 w-4.5 text-emerald-500" /> Inspected
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}

                        {bookings.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground italic">
                              No guest bookings found for your vehicles yet. Make sure your calendars are open!
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* CHECKLIST DIALOG */}
              <Dialog open={isChecklistModalOpen} onOpenChange={setIsChecklistModalOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-display text-lg font-bold">
                      {checklistType === "CHECK_IN" ? "Pre-Trip Handover Inspection" : "Post-Trip Return Inspection"}
                    </DialogTitle>
                    <DialogDescription>
                      Document the vehicle odometer, fuel level, and damages to prevent disputes.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-3">
                    <div className="space-y-1">
                      <Label htmlFor="odo">Odometer Reading (km)</Label>
                      <Input
                        id="odo"
                        type="number"
                        placeholder="e.g. 54320"
                        value={checklistForm.odometerReading}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, odometerReading: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="fuel">Fuel Level (%)</Label>
                      <select
                        id="fuel"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={checklistForm.fuelLevel}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, fuelLevel: e.target.value }))}
                      >
                        <option value="100">100% (Full)</option>
                        <option value="80">80%</option>
                        <option value="60">60%</option>
                        <option value="40">40%</option>
                        <option value="20">20%</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="notes">Scratches / Damages / Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Note down pre-existing/new damages..."
                        value={checklistForm.damageNotes}
                        onChange={(e) => setChecklistForm(prev => ({ ...prev, damageNotes: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Inspection Photos (Front, Back, Left, Right)</Label>
                      <input
                        type="file"
                        ref={checklistPhotoRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && uploadChecklistPhoto(e.target.files[0])}
                      />
                      
                      <div className="grid grid-cols-4 gap-2">
                        {checklistForm.images.map((img, i) => (
                          <div key={i} className="relative h-16 w-full rounded-lg overflow-hidden border">
                            <img src={img} alt="preview" className="h-full w-full object-cover" />
                          </div>
                        ))}
                        {checklistForm.images.length < 4 && (
                          <button
                            type="button"
                            onClick={() => checklistPhotoRef.current?.click()}
                            disabled={uploadingChecklistPhoto}
                            className="flex h-16 w-full flex-col items-center justify-center border-2 border-dashed rounded-lg hover:bg-muted/20 transition-colors"
                          >
                            {uploadingChecklistPhoto ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <>
                                <Camera className="h-4 w-4 text-muted-foreground" />
                                <span className="text-[8px] text-muted-foreground mt-1">Add Image</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsChecklistModalOpen(false)}>Cancel</Button>
                    <Button
                      disabled={submitChecklistMutation.isPending}
                      onClick={() => {
                        if (!checklistForm.odometerReading) {
                          toast.error("Please record the odometer reading.");
                          return;
                        }
                        submitChecklistMutation.mutate({
                          bookingId: selectedBooking.id,
                          vehicleId: selectedBooking.vehicleId,
                          type: checklistType,
                          odometerReading: Number(checklistForm.odometerReading),
                          fuelLevel: Number(checklistForm.fuelLevel),
                          damageNotes: checklistForm.damageNotes,
                          images: checklistForm.images,
                        });
                      }}
                    >
                      {submitChecklistMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Save Checklist"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* GPS TRACKING TAB */}
            <TabsContent value="gps" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Bookings Queue */}
                <div className="lg:col-span-1 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base font-bold font-display">Ongoing Bookings</CardTitle>
                      <CardDescription>Select an active car to track in real-time</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {bookings.filter((b: any) => b.status === "active").length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No cars are currently on active rentals.</p>
                      ) : (
                        bookings
                          .filter((b: any) => b.status === "active")
                          .map((b: any) => (
                            <div
                              key={b.id}
                              onClick={() => setSelectedTrackingBooking(b)}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                                selectedTrackingBooking?.id === b.id
                                  ? "bg-primary/5 border-primary shadow-sm"
                                  : "bg-card hover:bg-muted/10 border-border"
                              }`}
                            >
                              <div>
                                <h4 className="text-xs font-semibold">{b.vehicleName}</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Guest: {b.customerName}</p>
                                <p className="text-[10px] text-muted-foreground">ID: {b.id}</p>
                              </div>
                              <Badge className="bg-emerald-500 hover:bg-emerald-500 font-mono text-[9px]">ONLINE</Badge>
                            </div>
                          ))
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Map display */}
                <div className="lg:col-span-2">
                  <Card className="h-[550px] overflow-hidden flex flex-col">
                    <CardHeader className="bg-card py-4 border-b flex flex-row justify-between items-center shrink-0">
                      <div>
                        <CardTitle className="text-base font-bold font-display flex items-center gap-2">
                          <Compass className="h-5 w-5 text-primary" />
                          {selectedTrackingBooking ? `${selectedTrackingBooking.vehicleName} — Live GPS` : "Select a vehicle to track"}
                        </CardTitle>
                      </div>
                      {selectedTrackingBooking && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Last ping: Just now</span>
                        </div>
                      )}
                    </CardHeader>
                    
                    <div className="flex-1 bg-muted/10 relative">
                      {!leafletCssLoaded ? (
                        <div className="h-full w-full flex items-center justify-center flex-col gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-xs text-muted-foreground">Initializing GIS mapping layer...</p>
                        </div>
                      ) : !selectedTrackingBooking ? (
                        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-muted/5">
                          <MapIcon className="h-12 w-12 text-muted-foreground mb-4" />
                          <h3 className="font-display font-semibold text-lg">GPS Tracking Center</h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                            DriveLux fits a mandatory hardware GPS module to all host cars. Live coordinates, velocity vector indexes and route logs show up here for active trips.
                          </p>
                        </div>
                      ) : (
                        <MapContainer
                          center={simulatedLoc}
                          zoom={14}
                          style={{ height: "100%", width: "100%" }}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={simulatedLoc} icon={createCarIcon("online")!}>
                            <Popup>
                              <div className="p-2 space-y-1.5">
                                <h4 className="font-bold text-xs">{selectedTrackingBooking.vehicleName}</h4>
                                <p className="text-[10px] text-muted-foreground font-medium">Guest: {selectedTrackingBooking.customerName}</p>
                                <p className="text-[10px] text-muted-foreground">Location: Indiranagar, Bangalore</p>
                                <p className="text-[10px] text-muted-foreground font-semibold text-primary">Status: Tracking active (54 km/h)</p>
                              </div>
                            </Popup>
                          </Marker>
                        </MapContainer>
                      )}
                    </div>
                  </Card>
                </div>

              </div>
            </TabsContent>

            {/* PAYOUTS TAB */}
            <TabsContent value="payouts" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg font-bold">Host Payouts Ledger</CardTitle>
                  <CardDescription>Details of weekly batch direct deposits sent to your bank account.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payout ID</TableHead>
                          <TableHead>Date Initiated</TableHead>
                          <TableHead>Bank Reference Transaction Number</TableHead>
                          <TableHead>Amount Transferred</TableHead>
                          <TableHead className="text-right">Transfer Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((p: any) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-xs">PAY-#{p.id}</TableCell>
                            <TableCell className="text-xs">
                              {new Date(p.createdAt).toLocaleDateString([], { dateStyle: "long" })}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{p.referenceNum ?? "—"}</TableCell>
                            <TableCell className="font-bold text-emerald-600">
                              ₹{Number(p.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 font-semibold uppercase text-[10px]">
                                {p.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}

                        {payouts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground italic">
                              No payouts logged yet. Payout processing happens weekly for completed rentals.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </PublicLayout>
  );
}
