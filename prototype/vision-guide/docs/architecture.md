# SunnyFit AI Strength Coach Demo - Architecture & Execution Plan

## 1. Overview

This document describes the technical architecture, module design, and execution plan for the SunnyFit AI Strength Coach Demo. The demo validates that a single phone camera setup can deliver a complete, AI-guided dumbbell + bench strength training experience.

## 2. Technology Stack

| Component | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Mobile-first, component-based, type-safe |
| Build Tool | Vite 5 | Fast dev server, HMR, optimized builds |
| Pose Engine | MediaPipe Tasks Vision | 33 landmarks, browser WASM/WebGL, on-device |
| State Management | Zustand | Lightweight (~1KB), no boilerplate, real-time data friendly |
| Styling | CSS (custom properties) | Mobile-first, no extra deps, theme-able |
| TTS | Web Speech API (SpeechSynthesis) | Native browser, no external service needed |
| All Processing | On-device (browser) | Privacy-first, low latency, offline-capable |

## 3. System Architecture

```
Mobile Camera (getUserMedia)
    |
    v
Video Frame (HTMLVideoElement)
    |
    v
MediaPipe PoseLandmarker (WASM/WebGL)
    |
    v
33 Landmarks + Confidence
    |
    v
SmoothingFilter (weighted 5-frame window)
    |
    v
Exercise Detector (state machine per exercise)
    |
    +---> Rep Counter (phase transitions)
    |
    +---> Form Rule Engine (config-driven thresholds)
              |
              v
         IssueEvent (code + confidence)
              |
              v
         Feedback Scheduler
         - Sliding window (5s)
         - Consecutive occurrence threshold
         - Cooldown per issue (15-20s)
         - Priority queue
         - Max 2 feedbacks per set
              |
              +---> UI Bubble (4s display)
              +---> TTS Engine (SpeechSynthesis)
              |
              v
         Workout Session Manager
         - Warmup -> Main x 2 rounds -> Result
         - Rest timers, side switching
         - Pause / Resume / Exit
              |
              v
         Workout Result
         - Exercise summary
         - Coach Insight (rule-based)
         - RPE input
         - Analytics export
```

## 4. Module Descriptions

### 4.1 Pose Engine (`src/engine/pose/`)

**PoseEngine.ts** - Wraps MediaPipe PoseLandmarker
- Input: HTMLVideoElement + timestamp
- Output: 33 normalized landmarks (x, y, z, visibility)
- Running mode: VIDEO (frame-by-frame)
- GPU delegate for mobile performance

**SmoothingFilter.ts** - Temporal smoothing
- Linear-weighted 5-frame window
- Recent frames weighted more heavily
- Reduces jitter in landmark positions

### 4.2 Exercise Detectors (`src/engine/exercises/`)

**BaseExerciseDetector.ts** - Abstract base class
- State machine: IDLE -> START -> CONCENTRIC -> PEAK -> ECCENTRIC
- Hysteresis thresholds to prevent rapid toggling
- Consecutive frame confirmation (MIN_PHASE_FRAMES = 3)
- Issue recording with sliding window
- Config-driven thresholds from exercises.json

**Exercise-specific detectors:**

| Detector | Exercise | Key Measurement | Phase Trigger |
|---|---|---|---|
| SeatedCurlDetector | Seated Dumbbell Curl | Elbow flexion angle | 150deg -> 45deg |
| ShoulderPressDetector | Seated Shoulder Press | Arm extension angle | 80deg -> 165deg |
| LateralRaiseDetector | Seated Lateral Raise | Arm abduction angle | 15deg -> 80deg |
| SupportedRowDetector | Supported Dumbbell Row | Elbow flexion (unilateral) | 150deg -> 50deg |

### 4.3 Form Rule Engine

Rules are defined in `configs/exercises.json` per exercise:

```json
{
  "issue_code": "elbow_drift_forward",
  "severity": "coaching",
  "min_consecutive_occurrences": 3,
  "cooldown_seconds": 15,
  "message_key": "coach_curl_keep_elbows_still",
  "thresholds": { "elbow_forward_offset_max": 0.08 }
}
```

Each detector evaluates its rules during `analyzePose()` and calls `recordIssue()` when thresholds are exceeded.

### 4.4 Feedback Scheduler (`src/engine/feedback/`)

**FeedbackScheduler.ts**
- Receives IssueEvents from exercise detectors
- Sliding window: 5-second history per issue code
- Triggers when consecutive occurrences >= min_consecutive_occurrences
- Cooldown: prevents same issue from firing again for 15-20s
- Per-set limit: max 2 correction feedbacks per set
- Priority: lower number = higher priority
- Auto-clears feedback after 4 seconds

**TTSEngine.ts**
- Uses Web Speech API (SpeechSynthesis)
- Voice queue: max 3 items, prevents overlap
- Priority-based interruption (priority <= 1 interrupts)
- Configurable rate and volume
- Per-message tts_enabled flag

**Voice Guidance Coverage:**

| Timing | Content | Example |
|---|---|---|
| Exercise intro | Movement key points + rep target | "Seated Curl. Keep elbows pinned to your sides. 10 reps." |
| Countdown | 3-2-1 countdown | "3... 2... 1..." |
| Rep milestones | Progress updates | "5 reps done." / "Two more." |
| Form corrections | Real-time coaching | "Keep your elbows pinned to your sides." |
| Set complete | Achievement | "Set complete. Nice work!" |
| Rest | Timer guidance | "Rest for 20 seconds." |
| Exercise transition | Next exercise + tips | "Next: Shoulder Press. Sit tall, press both dumbbells straight up." |
| Side switch | Unilateral guidance | "Good. Now switch to the other side." |
| Round transition | Round summary | "Round 2. Looking much steadier this round." |
| Workout complete | Final encouragement | "Workout complete! Great job today." |

### 4.5 Workout Session Manager (`src/session/`)

**WorkoutSessionManager.ts** - Central orchestrator
- State machine: PREPARE -> COUNTDOWN -> ACTIVE_SET -> SET_COMPLETE -> REST -> NEXT_EXERCISE -> ... -> WORKOUT_COMPLETE
- Manages rounds, exercise transitions, rest periods
- Handles unilateral exercises (left/right side switching)
- Feeds pose data to active exercise detector
- Collects exercise results
- Subscriber pattern for UI updates

**Session States:**
```
PREPARE (2s) -> WARMUP / COUNTDOWN
COUNTDOWN (3s) -> ACTIVE_SET
ACTIVE_SET -> SET_COMPLETE (when target reps reached)
SET_COMPLETE (2s) -> REST_OR_SIDE_SWITCH / NEXT_EXERCISE / REST_BETWEEN_ROUNDS / WORKOUT_COMPLETE
REST_OR_SIDE_SWITCH (10s) -> COUNTDOWN
REST_BETWEEN_ROUNDS (45s) -> COUNTDOWN
NEXT_EXERCISE (rest 20s) -> COUNTDOWN
WORKOUT_COMPLETE -> Result Screen
```

**EventLogger.ts** - Analytics event tracking
- Logs all key events with timestamps
- Exportable as JSON for analysis

### 4.6 UI Components (`src/components/`)

**Screen Flow:**
```
Landing -> Equipment -> Privacy -> Camera Setup -> Workout -> Result
```

**Camera Setup Screen:**
- Live camera feed with mirrored display
- Pose overlay (minimal dots or full skeleton in dev mode)
- Validation overlay: body detected, joints visible, distance, stability
- Auto-validates readiness after 2+ seconds of stable detection
- Dev mode toggle for FPS/confidence display

**Workout Screen:**
- Camera as full-screen background
- Top bar: round indicator, elapsed time, pause/exit
- Center: countdown, rest timer, or completion message
- Bottom: exercise name, side indicator, rep counter, phase, feedback bubble
- Controls: dev mode, voice toggle, skip exercise

**Result Screen:**
- Achievement summary (rounds, duration)
- Exercise summary (reps per exercise, dominant issues)
- Coach Insight (rule-based text generation)
- One improvement focus
- RPE selector (1-10 scale)
- Actions: Done / Try Again

## 5. Configuration System

All thresholds, messages, and templates are config-driven:

| File | Purpose |
|---|---|
| `configs/camera_profiles.json` | Camera setup requirements, validation rules |
| `configs/exercises.json` | Exercise definitions, state machines, form rules, thresholds |
| `configs/workouts.json` | Workout templates, block structure, rounds |
| `configs/coach_messages.json` | All feedback text, exercise tips, TTS flags |

Adding a new exercise requires:
1. Add exercise config to `exercises.json`
2. Create detector class extending `BaseExerciseDetector`
3. Register in `WorkoutSessionManager.createDetector()`
4. Add messages to `coach_messages.json`

## 6. Project Structure

```
vision-guide/
├── configs/                          # JSON configuration files
│   ├── camera_profiles.json
│   ├── exercises.json
│   ├── workouts.json
│   └── coach_messages.json
├── docs/
│   └── architecture.md               # This document
├── src/
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Screen router
│   ├── types/                        # TypeScript interfaces
│   │   ├── camera.ts
│   │   ├── exercise.ts
│   │   ├── workout.ts
│   │   ├── pose.ts
│   │   ├── feedback.ts
│   │   └── analytics.ts
│   ├── engine/
│   │   ├── pose/
│   │   │   ├── PoseEngine.ts         # MediaPipe wrapper
│   │   │   └── SmoothingFilter.ts    # Temporal smoothing
│   │   ├── exercises/
│   │   │   ├── BaseExerciseDetector.ts
│   │   │   ├── SeatedCurlDetector.ts
│   │   │   ├── ShoulderPressDetector.ts
│   │   │   ├── LateralRaiseDetector.ts
│   │   │   └── SupportedRowDetector.ts
│   │   └── feedback/
│   │       ├── FeedbackScheduler.ts  # Cooldown + priority
│   │       └── TTSEngine.ts          # Web Speech API
│   ├── session/
│   │   ├── WorkoutSessionManager.ts  # Workout orchestrator
│   │   └── EventLogger.ts           # Analytics
│   ├── hooks/
│   │   ├── useCamera.ts             # getUserMedia
│   │   └── usePoseDetection.ts      # Frame loop
│   ├── store/
│   │   └── useStore.ts              # Zustand store
│   ├── components/
│   │   ├── screens/
│   │   │   ├── LandingScreen.tsx
│   │   │   ├── EquipmentScreen.tsx
│   │   │   ├── PrivacyScreen.tsx
│   │   │   ├── CameraSetupScreen.tsx
│   │   │   ├── WorkoutScreen.tsx
│   │   │   └── ResultScreen.tsx
│   │   ├── camera/
│   │   │   ├── PoseOverlay.tsx
│   │   │   └── ValidationOverlay.tsx
│   │   ├── workout/
│   │   │   ├── FeedbackBubble.tsx
│   │   │   ├── RepCounter.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   └── RoundIndicator.tsx
│   │   └── result/
│   │       ├── ExerciseSummary.tsx
│   │       ├── CoachInsight.tsx
│   │       └── RPESelector.tsx
│   ├── utils/
│   │   └── angleUtils.ts            # Angle calculation, landmark indices
│   └── styles/
│       └── index.css                 # Mobile-first CSS
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## 7. Build & Run

```bash
# Install dependencies
npm install

# Development (with network access for mobile testing)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Access from mobile device on same network via `http://<your-ip>:5173`

## 8. Build Phases & Milestones

### Phase 1: Foundation (Completed)
- [x] Vite + React + TypeScript project
- [x] Camera permission + live video feed
- [x] Mobile-first portrait layout
- [x] CSS design system

### Phase 2: Pose Detection (Completed)
- [x] MediaPipe PoseLandmarker integration
- [x] Frame processing loop (requestAnimationFrame)
- [x] Smoothing filter
- [x] Pose overlay visualization
- [x] FPS tracking

### Phase 3: Exercise Detection (Completed)
- [x] Config JSON files (exercises, workouts, camera, messages)
- [x] BaseExerciseDetector with state machine
- [x] SeatedCurlDetector
- [x] ShoulderPressDetector
- [x] LateralRaiseDetector
- [x] SupportedRowDetector

### Phase 4: Feedback & Voice (Completed)
- [x] FeedbackScheduler with cooldown/dedup
- [x] TTSEngine with queue management
- [x] Exercise tips (intro + key points per exercise)
- [x] Real-time correction messages
- [x] Milestone announcements
- [x] FeedbackBubble UI

### Phase 5: Camera Setup (Completed)
- [x] Camera validation (body, joints, distance, stability)
- [x] Visual guide overlay
- [x] Status indicators
- [x] Error states (too close/far, missing joints)

### Phase 6: Full Workout Flow (Completed)
- [x] WorkoutSessionManager
- [x] Warmup -> Main x 2 rounds -> Result
- [x] Rest timers, side switching
- [x] Countdown, exercise transitions
- [x] Pause, skip, exit handling

### Phase 7: Result & Polish (Completed)
- [x] Exercise summary
- [x] Coach Insight (rule-based)
- [x] RPE selector
- [x] Analytics event logging
- [x] Dev mode toggle
- [x] Voice on/off toggle
- [x] Mobile CSS optimization

## 9. Voice Guidance Design

### 9.1 Voice Guidance Types

| Type | Timing | Content |
|---|---|---|
| Exercise Intro | Before each exercise starts | Movement description + key points + rep target |
| Countdown | 3 seconds before active set | "3... 2... 1..." |
| Rep Milestones | At 50% and last 2 reps | "5 reps done." / "Two more." |
| Form Corrections | During active set (when issues detected) | Specific coaching cues |
| Set Complete | When target reps reached | "Set complete. Nice work!" |
| Rest Guidance | During rest periods | "Rest for 20 seconds." |
| Exercise Transition | Between exercises | Next exercise name + key movement tips |
| Side Switch | For unilateral exercises | "Good. Now switch to the other side." |
| Round Transition | Between rounds | "Round 2. Looking much steadier." |
| Workout Complete | At end | "Workout complete! Great job today." |

### 9.2 Voice Priority System

| Priority | Category | Behavior |
|---|---|---|
| 0 | Critical (pose lost) | Interrupts current speech |
| 1 | Safety-related corrections | High priority, interrupts if needed |
| 2 | Form corrections | Normal queue, respects cooldown |
| 3 | Milestones, transitions | Normal queue |
| 4 | Positive encouragement | Lowest priority, may be skipped |

### 9.3 Exercise-Specific Voice Tips

Each exercise has an `intro` message spoken before the exercise starts, containing:
1. Exercise name
2. Key movement points (2-3 cues)
3. Rep target

Example for Seated Curl:
> "Seated Dumbbell Curl. Keep your back against the bench and elbows pinned to your sides. Curl up with control, lower slowly. 10 reps."

## 10. Known Limitations

1. **2D Pose Accuracy**: MediaPipe provides 2D landmarks; depth estimation is limited. Some form rules may have reduced accuracy compared to 3D pose systems.
2. **Bench Detection**: No object detection for bench. Camera setup relies on user positioning and body landmark validation.
3. **Exercise Auto-Detection**: System does not auto-detect which exercise the user is performing. Exercise sequence is predetermined by the workout template.
4. **Shoulder Shrug Detection**: Not implemented for lateral raise. 2D pose makes this unreliable.
5. **Weight Detection**: No automatic weight recognition. User selects dumbbells manually.
6. **Multi-Person**: Only single-person detection supported. Multiple people in frame may cause issues.
7. **TTS Quality**: Web Speech API quality varies by device and OS. Some devices may have limited voice options.
8. **Offline**: MediaPipe model requires initial CDN download. Subsequent visits may use cached model.

## 11. Privacy & Safety

- All video processing happens on-device
- No video frames are uploaded or stored
- Only joint positions, rep counts, and form events are tracked
- Users can revoke camera access at any time
- This demo provides general fitness guidance, not medical advice
- Users experiencing pain or discomfort should stop immediately
