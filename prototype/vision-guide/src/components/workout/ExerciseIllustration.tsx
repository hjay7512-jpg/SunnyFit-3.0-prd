import React from 'react';

interface ExerciseIllustrationProps {
  exerciseId: string;
  className?: string;
}

const illustrations: Record<string, React.FC> = {
  seated_dumbbell_curl: CurlIllustration,
  seated_dumbbell_shoulder_press: PressIllustration,
  seated_dumbbell_lateral_raise: RaiseIllustration,
  supported_dumbbell_row: RowIllustration,
  seated_arm_circle: ArmCircleIllustration,
  seated_scapular_retraction: ScapularIllustration,
};

export const ExerciseIllustration: React.FC<ExerciseIllustrationProps> = ({ exerciseId, className }) => {
  const Component = illustrations[exerciseId];
  if (!Component) return null;
  return <Component />;
};

const BENCH = (
  <>
    <rect x="40" y="140" width="120" height="8" rx="3" fill="#4b5563" />
    <rect x="46" y="148" width="6" height="30" rx="2" fill="#4b5563" />
    <rect x="148" y="148" width="6" height="30" rx="2" fill="#4b5563" />
  </>
);

const BODY_SEATED = (
  <>
    <circle cx="100" cy="62" r="12" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
    <line x1="100" y1="74" x2="100" y2="130" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="100" y1="130" x2="78" y2="145" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="100" y1="130" x2="122" y2="145" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
  </>
);

function CurlIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="exercise-illust">
      {BENCH}
      {BODY_SEATED}
      {/* Left arm curling up */}
      <line x1="100" y1="85" x2="78" y2="108" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="78" y1="108" x2="72" y2="80" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="66" y="74" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Right arm curling up */}
      <line x1="100" y1="85" x2="122" y2="108" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="122" y1="108" x2="128" y2="80" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="122" y="74" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Curl motion arrows */}
      <path d="M 60 105 C 54 92, 54 82, 60 72" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="60,72 56,79 64,79" fill="#4ade80" />
      <path d="M 140 105 C 146 92, 146 82, 140 72" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="140,72 136,79 144,79" fill="#4ade80" />
    </svg>
  );
}

function PressIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="exercise-illust">
      {BENCH}
      {BODY_SEATED}
      {/* Left arm pressing up */}
      <line x1="100" y1="85" x2="74" y2="85" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="74" y1="85" x2="70" y2="48" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="64" y="42" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Right arm pressing up */}
      <line x1="100" y1="85" x2="126" y2="85" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="126" y1="85" x2="130" y2="48" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="124" y="42" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Press up arrows */}
      <path d="M 56 70 L 56 42" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="56,42 52,50 60,50" fill="#4ade80" />
      <path d="M 144 70 L 144 42" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="144,42 140,50 148,50" fill="#4ade80" />
    </svg>
  );
}

function RaiseIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="exercise-illust">
      {BENCH}
      {BODY_SEATED}
      {/* Left arm raised to side */}
      <line x1="100" y1="85" x2="62" y2="85" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="50" y="82" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Right arm raised to side */}
      <line x1="100" y1="85" x2="138" y2="85" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="136" y="82" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Shoulder height reference */}
      <line x1="48" y1="85" x2="152" y2="85" stroke="#4ade80" strokeWidth="1" strokeDasharray="4,3" opacity="0.4" />
      {/* Raise arrows */}
      <path d="M 52 115 C 44 102, 44 92, 52 85" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="52,85 48,92 56,92" fill="#4ade80" />
      <path d="M 148 115 C 156 102, 156 92, 148 85" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="148,85 144,92 152,92" fill="#4ade80" />
    </svg>
  );
}

function RowIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="exercise-illust">
      {/* Bench - horizontal */}
      <rect x="35" y="110" width="130" height="8" rx="3" fill="#4b5563" />
      <rect x="42" y="118" width="6" height="30" rx="2" fill="#4b5563" />
      <rect x="152" y="118" width="6" height="30" rx="2" fill="#4b5563" />
      {/* Head */}
      <circle cx="135" cy="55" r="12" fill="none" stroke="#60a5fa" strokeWidth="2.5" />
      {/* Torso - bent forward */}
      <line x1="133" y1="67" x2="100" y2="105" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      {/* Legs - standing */}
      <line x1="100" y1="105" x2="82" y2="148" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="105" x2="105" y2="148" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      {/* Support arm (left, holding bench edge) */}
      <line x1="125" y1="78" x2="145" y2="108" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rowing arm - upper arm */}
      <line x1="120" y1="80" x2="95" y2="82" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      {/* Rowing arm - forearm pulling back */}
      <line x1="95" y1="82" x2="80" y2="68" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="74" y="62" width="14" height="6" rx="2" fill="#f59e0b" />
      {/* Row motion arrow */}
      <path d="M 72 98 C 64 88, 64 76, 72 66" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="72,66 68,74 76,74" fill="#4ade80" />
      {/* "L" / "R" label hint */}
      <text x="55" y="58" fill="#9ca3af" fontSize="10" fontFamily="sans-serif">Single arm</text>
    </svg>
  );
}

function ArmCircleIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="exercise-illust">
      {BENCH}
      {BODY_SEATED}
      {/* Both arms extended to sides */}
      <line x1="100" y1="85" x2="55" y2="85" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="85" x2="145" y2="85" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      {/* Circle motion - left */}
      <circle cx="55" cy="85" r="16" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="55,69 51,75 59,75" fill="#4ade80" />
      {/* Circle motion - right */}
      <circle cx="145" cy="85" r="16" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeDasharray="3,2" />
      <polygon points="145,69 141,75 149,75" fill="#4ade80" />
    </svg>
  );
}

function ScapularIllustration() {
  return (
    <svg viewBox="0 0 200 200" className="exercise-illust">
      {BENCH}
      {BODY_SEATED}
      {/* Both arms - hands behind head */}
      <line x1="100" y1="85" x2="80" y2="76" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="80" y1="76" x2="86" y2="92" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="100" y1="85" x2="120" y2="76" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="120" y1="76" x2="114" y2="92" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" />
      {/* Shoulder blade squeeze arrows - both sides */}
      <path d="M 76 90 L 92 90" fill="none" stroke="#4ade80" strokeWidth="1.5" />
      <polygon points="92,90 87,87 87,93" fill="#4ade80" />
      <path d="M 124 90 L 108 90" fill="none" stroke="#4ade80" strokeWidth="1.5" />
      <polygon points="108,90 113,87 113,93" fill="#4ade80" />
      {/* Squeeze indicator on back */}
      <path d="M 96 95 L 100 100 L 104 95" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
