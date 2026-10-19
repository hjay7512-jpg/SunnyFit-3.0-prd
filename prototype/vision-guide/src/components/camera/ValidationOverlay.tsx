import React from 'react';
import type { CameraValidationStatus } from '../../types/camera';

interface ValidationOverlayProps {
  status: CameraValidationStatus;
  poseConfidence: number;
}

const statusConfig: Record<CameraValidationStatus, { label: string; ok: boolean; color: string }> = {
  checking: { label: 'Checking...', ok: false, color: '#fbbf24' },
  body_detected: { label: 'Body detected', ok: true, color: '#4ade80' },
  joints_visible: { label: 'Key joints visible', ok: true, color: '#4ade80' },
  good_distance: { label: 'Good distance', ok: true, color: '#4ade80' },
  camera_stable: { label: 'Camera stable', ok: true, color: '#4ade80' },
  ready: { label: 'Camera Ready', ok: true, color: '#4ade80' },
  too_close: { label: 'Step back so I can see more of your body', ok: false, color: '#f87171' },
  too_far: { label: 'Move a little closer', ok: false, color: '#f87171' },
  joints_missing: { label: 'Keep shoulders, hands and hips in view', ok: false, color: '#f87171' },
  low_light: { label: 'Move to a brighter area', ok: false, color: '#f87171' },
  multiple_people: { label: 'Make sure only one person is in frame', ok: false, color: '#f87171' },
  camera_unstable: { label: 'Keep your phone on a stable surface', ok: false, color: '#f87171' },
};

export const ValidationOverlay: React.FC<ValidationOverlayProps> = ({ status, poseConfidence }) => {
  const config = statusConfig[status];
  const isReady = status === 'ready';

  return (
    <div className="validation-overlay">
      {/* Guide frame */}
      <div className={`guide-frame ${isReady ? 'ready' : ''}`}>
        <svg viewBox="0 0 100 100" className="guide-svg">
          {/* Body silhouette guide */}
          <ellipse cx="50" cy="22" rx="8" ry="10" fill="none" stroke={config.color} strokeWidth="0.5" opacity="0.5" />
          <line x1="50" y1="32" x2="50" y2="60" stroke={config.color} strokeWidth="0.5" opacity="0.5" />
          <line x1="50" y1="38" x2="30" y2="52" stroke={config.color} strokeWidth="0.5" opacity="0.5" />
          <line x1="50" y1="38" x2="70" y2="52" stroke={config.color} strokeWidth="0.5" opacity="0.5" />
          <line x1="50" y1="60" x2="38" y2="82" stroke={config.color} strokeWidth="0.5" opacity="0.5" />
          <line x1="50" y1="60" x2="62" y2="82" stroke={config.color} strokeWidth="0.5" opacity="0.5" />
          {/* Bench guide */}
          <rect x="25" y="48" width="50" height="6" rx="1" fill="none" stroke={config.color} strokeWidth="0.3" opacity="0.3" strokeDasharray="2,2" />
        </svg>
      </div>

      {/* Status indicators */}
      <div className="validation-checks">
        <CheckItem label="Body detected" ok={status !== 'checking' && status !== 'too_close' && status !== 'too_far'} />
        <CheckItem label="Key joints visible" ok={status === 'joints_visible' || status === 'good_distance' || status === 'camera_stable' || status === 'ready'} />
        <CheckItem label="Good distance" ok={status === 'good_distance' || status === 'camera_stable' || status === 'ready'} />
        <CheckItem label="Camera stable" ok={status === 'camera_stable' || status === 'ready'} />
      </div>

      {/* Status message */}
      {!isReady && (
        <div className="validation-message" style={{ color: config.color }}>
          {config.label}
        </div>
      )}

      {isReady && (
        <div className="validation-ready">
          <div className="ready-icon">&#10003;</div>
          <div className="ready-text">Camera Ready</div>
          <div className="ready-sub">Your coach can see your movement</div>
        </div>
      )}

      {/* Confidence indicator (dev) */}
      {poseConfidence > 0 && (
        <div className="confidence-bar">
          <div
            className="confidence-fill"
            style={{ width: `${poseConfidence * 100}%`, backgroundColor: config.color }}
          />
        </div>
      )}
    </div>
  );
};

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`check-item ${ok ? 'pass' : 'pending'}`}>
      <span className="check-icon">{ok ? '\u2713' : '\u25CB'}</span>
      <span>{label}</span>
    </div>
  );
}
