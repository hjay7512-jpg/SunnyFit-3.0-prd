import React, { useEffect, useRef, useCallback } from 'react';
import type { PoseLandmarks } from '../../types/pose';
import { POSE_LANDMARKS } from '../../utils/angleUtils';

interface PoseOverlayProps {
  landmarks: PoseLandmarks | null;
  showSkeleton: boolean;
}

const CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26],
  [25, 27], [26, 28],
];

export const PoseOverlay: React.FC<PoseOverlayProps> = ({ landmarks, showSkeleton }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !landmarks) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showSkeleton) {
      // Draw minimal dots at key joints only
      const keyJoints = [
        POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER,
        POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.RIGHT_ELBOW,
        POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.RIGHT_WRIST,
        POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP,
      ];

      for (const idx of keyJoints) {
        const lm = landmarks.landmarks[idx];
        if (!lm || lm.visibility < 0.4) continue;
        const x = lm.x * canvas.width;
        const y = lm.y * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = lm.visibility > 0.7 ? '#4ade80' : '#fbbf24';
        ctx.fill();
      }
      return;
    }

    // Draw connections
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    for (const [a, b] of CONNECTIONS) {
      const lmA = landmarks.landmarks[a];
      const lmB = landmarks.landmarks[b];
      if (!lmA || !lmB || lmA.visibility < 0.4 || lmB.visibility < 0.4) continue;
      ctx.beginPath();
      ctx.moveTo(lmA.x * canvas.width, lmA.y * canvas.height);
      ctx.lineTo(lmB.x * canvas.width, lmB.y * canvas.height);
      ctx.stroke();
    }

    // Draw landmarks
    for (let i = 0; i < landmarks.landmarks.length; i++) {
      const lm = landmarks.landmarks[i];
      if (!lm || lm.visibility < 0.4) continue;
      const x = lm.x * canvas.width;
      const y = lm.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = lm.visibility > 0.7 ? '#4ade80' : '#fbbf24';
      ctx.fill();
    }
  }, [landmarks, showSkeleton]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="pose-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
};
