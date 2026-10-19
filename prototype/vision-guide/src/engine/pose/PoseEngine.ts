import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import type { PoseLandmarks, Landmark } from '../../types/pose';

export class PoseEngine {
  private landmarker: PoseLandmarker | null = null;
  private lastTimestamp: number = -1;
  private strictErrors = false;
  private consecutiveErrors = 0;
  private disposed = false;
  delegate: 'GPU' | 'CPU' = 'GPU';

  async initialize(options: {wasmBase?: string; modelPath?: string; delegate?: 'GPU'|'CPU'; strictErrors?: boolean} = {}): Promise<void> {
    this.disposed=false;
    const vision = await FilesetResolver.forVisionTasks(
      options.wasmBase || 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
    );
    this.strictErrors=!!options.strictErrors;
    const create = (delegate: 'GPU'|'CPU') => PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          options.modelPath || 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate,
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    this.delegate=options.delegate||'GPU';
    try { this.landmarker=await create(this.delegate); }
    catch(error) { if(this.delegate==='CPU')throw error;this.delegate='CPU';this.landmarker=await create('CPU'); }
    if(this.disposed){this.landmarker.close();this.landmarker=null;throw new Error('Recognition initialization was cancelled.');}
  }

  detectPose(videoElement: HTMLVideoElement, timestampMs: number): PoseLandmarks | null {
    if (!this.landmarker) return null;
    if (timestampMs <= this.lastTimestamp) return null;
    if (videoElement.readyState < 2) return null;
    if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) return null;
    this.lastTimestamp = timestampMs;

    try {
      const results = this.landmarker.detectForVideo(videoElement, timestampMs);
      this.consecutiveErrors=0;
      if (!results.landmarks || results.landmarks.length === 0) return null;

      const rawLandmarks = results.landmarks[0];
      const landmarks: Landmark[] = rawLandmarks.map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z ?? 0,
        visibility: lm.visibility ?? 0,
      }));

      const avgVisibility =
        landmarks.reduce((sum, lm) => sum + lm.visibility, 0) / landmarks.length;

      return { landmarks, timestamp: timestampMs, confidence: avgVisibility };
    } catch (e) {
      this.consecutiveErrors++;
      if(this.strictErrors&&this.consecutiveErrors>=3)throw new Error('Body recognition stopped responding. Retry the camera or continue with Follow along.');
      console.warn('[PoseEngine] detection error:', e);
      return null;
    }
  }

  dispose(): void {
    this.disposed=true;
    this.landmarker?.close();
    this.landmarker = null;
  }
}
