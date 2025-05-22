"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { iotSensorMonitor } from "@/services/iot-sensor"
import { WifiOff, CheckCircle, AlertTriangle } from "lucide-react"

export function IoTSensorStatus() {
  const lastStatusRef = useRef<string>("")

  useEffect(() => {
    iotSensorMonitor.startMonitoring()

    const interval = setInterval(() => {
      const { status, error } = iotSensorMonitor.getConnectionStatus()

      if (status !== lastStatusRef.current) {
        lastStatusRef.current = status

        if (status === "error") {
          toast("IoT Sensor Error", {
            description: error ?? "Unknown failure",
            icon: <AlertTriangle className="text-red-500" />,
          })
        } else if (status === "connected") {
          toast("IoT Sensor Connected", {
            description: "Monitoring active",
            icon: <CheckCircle className="text-green-500" />,
          })
        } else {
          toast("IoT Sensor Disconnected", {
            description: "Trying to reconnect...",
            icon: <WifiOff className="text-yellow-500" />,
          })
        }
      }
    }, 3000)

    return () => {
      iotSensorMonitor.stopMonitoring()
      clearInterval(interval)
    }
  }, [])

  return null
}
