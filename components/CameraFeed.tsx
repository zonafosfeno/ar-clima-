import React, { useEffect, useRef, useState } from 'react';

export const CameraFeed: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Prefer back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setPermissionError(true);
      }
    };

    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (permissionError) {
    return (
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center text-center p-4">
        <div className="max-w-md">
          <p className="text-red-400 text-lg mb-2">Cámara no disponible</p>
          <p className="text-gray-300">Necesitamos acceso a la cámara para la experiencia de realidad aumentada. Por favor revisa los permisos de tu navegador.</p>
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover z-0"
    />
  );
};
