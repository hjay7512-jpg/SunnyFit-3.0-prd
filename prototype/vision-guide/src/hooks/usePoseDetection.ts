import { useRef, useCallback, useEffect } from 'react';
import { PoseEngine } from '../engine/pose/PoseEngine';
import { SmoothingFilter } from '../engine/pose/SmoothingFilter';
import type { PoseLandmarks } from '../types/pose';
import { useStore } from '../store/useStore';

export function usePoseDetection(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const engineRef = useRef<PoseEngine | null>(null);
  const filterRef = useRef<SmoothingFilter>(new SmoothingFilter(5));
  const rafRef = useRef<number>(0);
  const runningRef = useRef(false);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now() });

  const { setFps, setPoseConfidence } = useStore();

  const initialize = useCallback(async () => {
    const engine = new PoseEngine();
    await engine.initialize();
    engineRef.current = engine;
    filterRef.current.reset();
  }, []);

  const startDetection = useCallback((onPose: (pose: PoseLandmarks) => void) => {
    if (runningRef.current) return;
    runningRef.current = true;

    const loop = () => {
      if (!runningRef.current || !videoRef.current || !engineRef.current) return;

      const now = performance.now();
      const pose = engineRef.current.detectPose(videoRef.current, now);

      if (pose) {
        const smoothed = filterRef.current.push(pose.landmarks);
        const smoothedPose: PoseLandmarks = {
          landmarks: smoothed,
          timestamp: pose.timestamp,
          confidence: pose.confidence,
        };
        setPoseConfidence(pose.confidence);
        onPose(smoothedPose);
      } else {
        setPoseConfidence(0);
      }

      // FPS tracking
      fpsCounterRef.current.frames++;
      const elapsed = now - fpsCounterRef.current.lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsCounterRef.current.frames * 1000) / elapsed));
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [videoRef, setFps, setPoseConfidence]);

  const stopDetection = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      engineRef.current?.dispose();
    };
  }, []);

  return { initialize, startDetection, stopDetection };
}
