import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Flashlight, SwitchCamera } from "lucide-react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

interface Props {
  open: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => void;
  continuous?: boolean;
}

export default function BarcodeScannerModal({ open, onClose, onDetected, continuous = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIdx, setDeviceIdx] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const detectedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (readerRef.current) {
      try { BrowserMultiFormatReader.releaseAllStreams(); } catch { /* ignore */ }
      readerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    detectedRef.current = false;
  }, []);

  const startScanner = useCallback(async (devIdx: number) => {
    if (!videoRef.current) return;
    stopCamera();
    setError(null);
    detectedRef.current = false;

    try {
      const allDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      const videoDevices = allDevices.filter(d => d.kind === "videoinput");
      if (videoDevices.length === 0) { setError("No camera found on this device"); return; }
      setDevices(videoDevices);

      const device = videoDevices[Math.min(devIdx, videoDevices.length - 1)];
      const reader = new BrowserMultiFormatReader(undefined, { delayBetweenScanAttempts: 150 });
      readerRef.current = reader;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: device.deviceId, facingMode: devIdx === 0 ? "environment" : undefined }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (result && !detectedRef.current) {
          detectedRef.current = true;
          const text = result.getText();
          
          if (!continuous) {
            stopCamera();
            onDetected(text);
            onClose();
          } else {
            onDetected(text);
            // In continuous mode, allow scanning again after a short delay
            setTimeout(() => {
              detectedRef.current = false;
            }, 1000); // 1s cooldown between scans
          }
        }
        if (err && !(err instanceof NotFoundException)) {
          console.warn("Scan error:", err);
        }
      });
    } catch (e: any) {
      if (e?.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access and try again.");
      } else {
        setError("Could not start camera: " + (e?.message ?? "Unknown error"));
      }
    }
  }, [stopCamera, onDetected, onClose]);

  useEffect(() => {
    if (open) {
      startScanner(deviceIdx);
    } else {
      stopCamera();
    }
    return () => { stopCamera(); };
  }, [open]);

  const switchCamera = () => {
    const next = (deviceIdx + 1) % Math.max(devices.length, 1);
    setDeviceIdx(next);
    startScanner(next);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newVal = !torchOn;
      await (track as any).applyConstraints({ advanced: [{ torch: newVal }] });
      setTorchOn(newVal);
    } catch { /* torch not supported */ }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 bg-black/60 backdrop-blur absolute top-0 left-0 right-0 z-10">
        <p className="text-white font-semibold text-base">Scan Barcode</p>
        <button
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/30"
          onClick={() => { stopCamera(); onClose(); }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-44">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-primary rounded-tl-sm" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-[3px] border-r-[3px] border-primary rounded-tr-sm" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[3px] border-l-[3px] border-primary rounded-bl-sm" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[3px] border-r-[3px] border-primary rounded-br-sm" />
            {/* Scan line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-primary/70 blur-[1px] animate-pulse" />
          </div>
        </div>

        {/* Dark vignette sides */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-8">
            <div className="bg-white/10 rounded-2xl p-5 text-center">
              <p className="text-white text-sm">{error}</p>
              <button
                className="mt-3 text-primary text-sm font-semibold"
                onClick={() => startScanner(deviceIdx)}
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/60 backdrop-blur pb-safe pb-6 pt-4 flex items-center justify-center gap-10">
        {devices.length > 1 && (
          <button
            className="flex flex-col items-center gap-1 text-white/70 active:text-white"
            onClick={switchCamera}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
              <SwitchCamera className="w-5 h-5" />
            </div>
            <span className="text-[10px]">Flip</span>
          </button>
        )}
        <button
          className={`flex flex-col items-center gap-1 active:text-white ${torchOn ? "text-yellow-400" : "text-white/70"}`}
          onClick={toggleTorch}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${torchOn ? "bg-yellow-400/20" : "bg-white/10"}`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
            </svg>
          </div>
          <span className="text-[10px]">{torchOn ? "Torch On" : "Torch"}</span>
        </button>
      </div>

      <p className="absolute bottom-28 left-0 right-0 text-center text-white/50 text-xs pointer-events-none">
        Point camera at a barcode
      </p>
    </div>
  );
}
