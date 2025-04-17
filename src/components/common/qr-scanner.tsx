"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, X } from "lucide-react"

interface QrScannerProps {
  onScan: (url: string) => void
}

export function QrScanner({ onScan }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  const startScanner = async () => {
    setError(null)
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // In a real app, we would use a QR code scanning library here
      // For demo purposes, we'll simulate a scan after 3 seconds
      setTimeout(() => {
        // Simulate finding a LinkedIn profile URL
        onScan("https://linkedin.com/in/alexjohnson")
        stopScanner()
      }, 3000)
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Could not access camera. Please check permissions.")
      setIsScanning(false)
    }
  }

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div>
      <Button onClick={startScanner} className="w-full" size="sm">
        <Camera className="mr-2 h-4 w-4" />
        Scan QR
      </Button>

      {isScanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="relative w-full max-w-md p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 z-10 rounded-full bg-zinc-800/50 text-white hover:bg-zinc-800"
              onClick={stopScanner}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="overflow-hidden rounded-lg bg-black">
              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
              <canvas ref={canvasRef} className="absolute left-0 top-0 hidden" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-48 w-48 animate-pulse rounded-lg border-2 border-dashed border-zinc-400" />
              </div>
            </div>

            {error && <div className="mt-2 rounded-md bg-red-500/10 p-2 text-center text-sm text-red-500">{error}</div>}

            <div className="mt-4 text-center text-sm text-white">Position the QR code within the frame</div>

            <Button
              onClick={stopScanner}
              variant="outline"
              className="mt-4 w-full bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Cancel Scanning
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
