import { useRef, useCallback, useState } from 'react';
import { useStore } from '../store/useStore';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { setCameraPermission } = useStore();
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    try {
      setError(null);

      if (!window.isSecureContext) {
        const msg = 'Camera requires HTTPS. Please use https:// URL.';
        setError(msg);
        setCameraPermission('denied');
        return false;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const msg = 'Camera API not supported in this browser.';
        setError(msg);
        setCameraPermission('denied');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 720 },
          height: { ideal: 1280 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
        // Wait until video actually has frames
        if (video.readyState < 2) {
          await new Promise<void>((resolve) => {
            const onLoaded = () => { resolve(); video.removeEventListener('loadeddata', onLoaded); };
            video.addEventListener('loadeddata', onLoaded);
            // Timeout fallback: resolve after 3s even if event doesn't fire
            setTimeout(resolve, 3000);
          });
        }
      }
      setCameraPermission('granted');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access failed';
      setError(message);
      setCameraPermission('denied');
      return false;
    }
  }, [setCameraPermission]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  return { videoRef, startCamera, stopCamera, error };
}
