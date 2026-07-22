type MediaPipeGlobals = {
  Pose: new (config: { locateFile: (file: string) => string }) => MediaPipePose;
  Camera: new (video: HTMLVideoElement, config: Record<string, unknown>) => MediaPipeCamera;
  drawConnectors: (...args: unknown[]) => void;
  drawLandmarks: (...args: unknown[]) => void;
  POSE_CONNECTIONS: unknown;
};

type MediaPipePose = {
  setOptions: (options: Record<string, unknown>) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  // MediaPipe Pose accepts any canvas image source (video, <img>, or canvas),
  // so measurements can be taken from a live camera or an uploaded photo.
  send: (input: {
    image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;
  }) => Promise<void>;
};

type MediaPipeCamera = {
  start: () => Promise<void>;
  stop: () => void;
};

export type MediaPipeResults = {
  image: CanvasImageSource;
  poseLandmarks?: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
};

declare global {
  interface Window {
    Pose?: MediaPipeGlobals["Pose"];
    Camera?: MediaPipeGlobals["Camera"];
    drawConnectors?: MediaPipeGlobals["drawConnectors"];
    drawLandmarks?: MediaPipeGlobals["drawLandmarks"];
    POSE_CONNECTIONS?: MediaPipeGlobals["POSE_CONNECTIONS"];
  }
}

let loadPromise: Promise<MediaPipeGlobals> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export function loadMediaPipe(): Promise<MediaPipeGlobals> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js");

    const { Pose, Camera, drawConnectors, drawLandmarks, POSE_CONNECTIONS } = window;

    if (!Pose || !Camera || !drawConnectors || !drawLandmarks || !POSE_CONNECTIONS) {
      throw new Error("MediaPipe libraries failed to initialize");
    }

    return { Pose, Camera, drawConnectors, drawLandmarks, POSE_CONNECTIONS };
  })();

  return loadPromise;
}

export type { MediaPipePose, MediaPipeCamera };
