import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useCamera } from '../../hooks/useCamera';
import { usePoseDetection } from '../../hooks/usePoseDetection';
import { PoseOverlay } from '../camera/PoseOverlay';
import { ValidationOverlay } from '../camera/ValidationOverlay';
import type { PoseLandmarks } from '../../types/pose';
import { POSE_LANDMARKS } from '../../utils/angleUtils';

export const CameraSetupScreen: React.FC = () => {
  const { setScreen, setCameraValidation, cameraValidation, devMode, fps, poseConfidence, toggleDevMode } = useStore();
  const { videoRef, startCamera, stopCamera } = useCamera();
  const { initialize, startDetection, stopDetection } = usePoseDetection(videoRef);
  const [poseData, setPoseData] = useState<PoseLandmarks | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const stabilityRef = useRef<{ count: number; lastCheck: number }>({ count: 0, lastCheck: Date.now() });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await startCamera('user');
      if (ok && mounted) {
        try {
          await initialize();
          setEngineReady(true);
        } catch (e) {
          console.error('Pose engine init failed:', e);
        }
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
      stopDetection();
      stopCamera();
    };
  }, [startCamera, stopCamera, initialize, stopDetection]);

  const handlePose = useCallback((pose: PoseLandmarks) => {
    setPoseData(pose);
    validateCamera(pose);
  }, []);

  useEffect(() => {
    if (engineReady) {
      startDetection(handlePose);
    }
    return () => stopDetection();
  }, [engineReady, startDetection, stopDetection, handlePose]);

  const validateCamera = (pose: PoseLandmarks) => {
    const lm = pose.landmarks;
    const now = Date.now();

    // Check key landmarks visibility
    const shoulderL = lm[POSE_LANDMARKS.LEFT_SHOULDER];
    const shoulderR = lm[POSE_LANDMARKS.RIGHT_SHOULDER];
    const elbowL = lm[POSE_LANDMARKS.LEFT_ELBOW];
    const elbowR = lm[POSE_LANDMARKS.RIGHT_ELBOW];
    const wristL = lm[POSE_LANDMARKS.LEFT_WRIST];
    const wristR = lm[POSE_LANDMARKS.RIGHT_WRIST];
    const hipL = lm[POSE_LANDMARKS.LEFT_HIP];
    const hipR = lm[POSE_LANDMARKS.RIGHT_HIP];
    const kneeL = lm[POSE_LANDMARKS.LEFT_KNEE];
    const kneeR = lm[POSE_LANDMARKS.RIGHT_KNEE];

    const minVis = 0.4;
    const shouldersOk = (shoulderL?.visibility ?? 0) > minVis && (shoulderR?.visibility ?? 0) > minVis;
    const elbowsOk = (elbowL?.visibility ?? 0) > minVis && (elbowR?.visibility ?? 0) > minVis;
    const wristsOk = (wristL?.visibility ?? 0) > minVis && (wristR?.visibility ?? 0) > minVis;
    const hipsOk = (hipL?.visibility ?? 0) > minVis && (hipR?.visibility ?? 0) > minVis;
    const kneesOk = (kneeL?.visibility ?? 0) > minVis || (kneeR?.visibility ?? 0) > minVis;

    if (!shouldersOk || !hipsOk) {
      // Check if body is too close or too far
      if (shouldersOk && !hipsOk) {
        setCameraValidation('too_close');
      } else if (!shouldersOk && hipsOk) {
        setCameraValidation('too_far');
      } else {
        setCameraValidation('joints_missing');
      }
      stabilityRef.current.count = 0;
      return;
    }

    setCameraValidation('body_detected');

    if (!elbowsOk || !wristsOk) {
      setCameraValidation('joints_missing');
      stabilityRef.current.count = 0;
      return;
    }

    setCameraValidation('joints_visible');

    // Check distance: shoulders should span reasonable portion of frame
    const shoulderWidth = Math.abs(shoulderL.x - shoulderR.x);
    if (shoulderWidth < 0.08) {
      setCameraValidation('too_far');
      stabilityRef.current.count = 0;
      return;
    }
    if (shoulderWidth > 0.5) {
      setCameraValidation('too_close');
      stabilityRef.current.count = 0;
      return;
    }

    setCameraValidation('good_distance');

    // Check stability: need consistent detection for 2 seconds
    if (now - stabilityRef.current.lastCheck > 500) {
      stabilityRef.current.count++;
      stabilityRef.current.lastCheck = now;
    }

    if (stabilityRef.current.count >= 4) { // 4 * 500ms = 2 seconds
      setCameraValidation('camera_stable');
      // After another brief stable period, mark as ready
      if (stabilityRef.current.count >= 6) {
        setCameraValidation('ready');
      }
    }
  };

  const isReady = cameraValidation === 'ready';
  const [autoStartCountdown, setAutoStartCountdown] = useState(3);
  const autoStartRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isReady || loading) {
      setAutoStartCountdown(3);
      if (autoStartRef.current) {
        clearInterval(autoStartRef.current);
        autoStartRef.current = null;
      }
      return;
    }

    setAutoStartCountdown(3);
    autoStartRef.current = setInterval(() => {
      setAutoStartCountdown(prev => {
        if (prev <= 1) {
          if (autoStartRef.current) clearInterval(autoStartRef.current);
          stopDetection();
          setScreen('workout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (autoStartRef.current) {
        clearInterval(autoStartRef.current);
        autoStartRef.current = null;
      }
    };
  }, [isReady, loading, stopDetection, setScreen]);

  return (
    <div className="screen camera-setup-screen">
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
        <PoseOverlay landmarks={poseData} showSkeleton={devMode} />
        <ValidationOverlay status={cameraValidation} poseConfidence={poseConfidence} />

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner" />
            <p>Initializing camera...</p>
          </div>
        )}
      </div>

      {!loading && (
        <div className="setup-bottom">
          {devMode && (
            <div className="dev-info">
              FPS: {fps} | Confidence: {(poseConfidence * 100).toFixed(0)}% | Status: {cameraValidation}
            </div>
          )}

          <div className="setup-actions">
            <button className="btn-ghost" onClick={toggleDevMode}>
              {devMode ? 'Hide Dev' : 'Dev Mode'}
            </button>

            {isReady ? (
              <div className="auto-start-display">
                <div className="auto-start-text">Starting in {autoStartCountdown}...</div>
                <div className="auto-start-bar">
                  <div
                    className="auto-start-bar-fill"
                    style={{ width: `${((3 - autoStartCountdown) / 3) * 100}%` }}
                  />
                </div>
                <button
                  className="btn-ghost"
                  onClick={() => {
                    stopDetection();
                    setScreen('workout');
                  }}
                >
                  Start Now
                </button>
              </div>
            ) : (
              <div className="setup-hint">
                <p>Position your phone 2-3m away at a 30-45 degree angle.</p>
                <p>Make sure your head to knees are visible.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
