"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Bluetooth,
  Navigation,
  User,
  Mic,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EnhancedSOSButton } from "@/components/enhanced-sos-button";
import { BatteryStatus } from "@/components/battery-status";
import { ThemeToggle } from "@/components/theme-toggle";
import { IoTSensorStatus } from "@/components/ui/iot-sensor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileLayout } from "./mobile-layout";

export function Dashboard() {
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false);
  const mapRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && mapRef.current) {
      const L = require("leaflet");
      require("leaflet/dist/leaflet.css");

      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([0, 0], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          map.setView([latitude, longitude], 15);
          L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup("Your Current Location")
            .openPopup();
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert(
            "Location access denied or error occurred. Please enable location services."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );

      return () => {
        try {
          map.remove();
        } catch (err) {
          console.error("Error cleaning up map:", err);
        }
      };
    }
  }, []);

  return (
    <MobileLayout>
      <div className="flex flex-col h-full bg-[#0a0a16] text-cyan-50 relative overflow-hidden">
        {/* Background visuals */}
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=400')] bg-cover bg-center opacity-5 z-0" />
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-0 left-0 w-[200%] h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 transform -rotate-12 translate-y-20" />
          <div className="absolute top-0 left-0 w-[200%] h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 transform -rotate-12 translate-y-40" />
          <div className="absolute bottom-0 left-0 w-[200%] h-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 transform -rotate-12 -translate-y-60" />
          <div className="absolute bottom-0 left-0 w-[200%] h-0.5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 transform -rotate-12 -translate-y-40" />
        </div>

        {/* Header */}
        <div className="relative z-10 w-full px-4 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-lg blur opacity-70" />
                <div className="relative bg-[#0a0a16] p-2 rounded-lg">
                  <HardHat className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-fuchsia-400 bg-clip-text text-transparent">
                  CRUZLINK
                </h1>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Map Section */}
        <div className="relative z-10 px-4 py-2">
          <Card className="bg-[#0a0a16] border-cyan-900/30 overflow-hidden">
            <div ref={mapRef} className="w-full h-[200px]" />
          </Card>
        </div>

        {/* Main content */}
        <div className="relative z-10 flex-1 px-4 py-2">
          <div className="mb-6">
            <h2 className="text-xs uppercase tracking-wider text-cyan-300 mb-3 font-semibold">
              Support Systems
            </h2>

            {/* ✅ Wrapped with ScrollArea */}
            <ScrollArea className="w-full pb-2">
              <div className="flex gap-3 w-max px-1">
                {[
                  {
                    href: "/bluetooth",
                    title: "Devices",
                    subtitle: "Connected: 2",
                    icon: <Bluetooth className="h-5 w-5 text-blue-400" />,
                    color: "blue",
                  },
                  {
                    href: "/navigation",
                    title: "Navigate",
                    subtitle: "Route planning",
                    icon: <Navigation className="h-5 w-5 text-purple-400" />,
                    color: "purple",
                  },
                  {
                    href: "/ai-assistant",
                    title: "Cruz AI",
                    subtitle: "Assistant",
                    icon: <Mic className="h-5 w-5 text-amber-400" />,
                    color: "amber",
                  },
                  {
                    href: "/profile",
                    title: "Profile",
                    subtitle: "Settings",
                    icon: <User className="h-5 w-5 text-cyan-400" />,
                    color: "cyan",
                  },
                ].map(({ href, title, subtitle, icon, color }) => (
                  <Link key={href} href={href} className="flex-shrink-0 w-40">
                    <Card className={`bg-[#0a0a16] border-${color}-900/30 hover:border-${color}-500/50 transition-colors`}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`bg-${color}-900/30 p-2 rounded-lg`}>
                            {icon}
                          </div>
                          <div>
                            <h3 className={`text-sm font-medium text-${color}-400`}>
                              {title}
                            </h3>
                            <p className={`text-xs text-${color}-300/70`}>
                              {subtitle}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* SOS Button */}
          <div className="flex justify-center mb-6 mt-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full blur opacity-70 animate-pulse" />
              <div className="relative">
                <EnhancedSOSButton />
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="relative z-10 w-full p-4 bg-[#0a0a16]/80 backdrop-blur-sm border-t border-cyan-900/30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              <BatteryStatus percentage={76} />
            </div>
            <IoTSensorStatus />
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
