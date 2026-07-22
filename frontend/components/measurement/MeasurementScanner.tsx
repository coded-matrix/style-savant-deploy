'use client';

import { useEffect, useRef, useState } from 'react';
import {
  loadMediaPipe,
  type MediaPipeCamera,
  type MediaPipePose,
  type MediaPipeResults,
} from '@/lib/measurement/mediapipe-loader';
import { calculateMeasurements } from '@/lib/measurement/calculator';
import type { Landmark, MeasurementResult } from '@/lib/measurement/types';
import { measurementApi } from '@/lib/api/measurement';
import { getConsumerToken } from '@/lib/api/token';
import { Download, RotateCcw, Camera as CameraIcon, Upload } from 'lucide-react';

export default function MeasurementScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [photoMode, setPhotoMode] = useState(false);
  const [measurements, setMeasurements] = useState<MeasurementResult | null>(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const poseRef = useRef<MediaPipePose | null>(null);
  const cameraRef = useRef<MediaPipeCamera | null>(null);
  const mediaPipeRef = useRef<Awaited<ReturnType<typeof loadMediaPipe>> | null>(null);

  const updateStatus = (message: string, type: 'info' | 'success' | 'error') => {
    setStatus(message);
    setStatusType(type);
  };

  // Lazily create a Pose instance configured for measurement. Reused across
  // camera capture and photo upload so we only load the model once.
  const ensurePose = async (): Promise<MediaPipePose> => {
    if (poseRef.current) return poseRef.current;
    const mediaPipe = await loadMediaPipe();
    mediaPipeRef.current = mediaPipe;
    const pose = new mediaPipe.Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    poseRef.current = pose;
    return pose;
  };

  // Persist a completed measurement to the backend so the size-recommendation
  // endpoint has data to work with. Silently skips when the visitor is a guest
  // (no auth token) — the on-screen result is still shown either way.
  const persistMeasurement = async (result: MeasurementResult, landmarks: Landmark[]) => {
    if (!getConsumerToken()) return;
    try {
      await measurementApi.saveMeasurement({
        chest: result.chestInches,
        bust: result.bustInches,
        underbust: result.underbustInches,
        shoulderWidth: result.shoulderWidthInches,
        neck: result.neckInches,
        sleeveLength: result.sleeveLengthInches,
        bicep: result.bicepInches,
        wrist: result.wristInches,
        backLength: result.backLengthInches,
        waist: result.waistInches,
        hips: result.hipsInches,
        thigh: result.thighInches,
        knee: result.kneeInches,
        calf: result.calfInches,
        inseam: result.inseamInches,
        outseam: result.outseamInches,
        height: result.heightInches,
        recommendedSize: result.recommendedSize,
        confidencePercent: result.confidencePercent,
        rawLandmarks: landmarks,
      });
      updateStatus('All done! Your measurements are saved.', 'success');
    } catch (err) {
      console.error('Failed to save measurement:', err);
      updateStatus('Got your measurements. We couldn\'t save them — please try again.', 'error');
    }
  };

  // A usable measurement needs the full body in frame: both shoulders, hips,
  // knees, and ankles have to be confidently detected. If they aren't, the
  // photo is a crop/close-up and the measurements would be garbage — we ask
  // for a different picture instead of returning nonsense numbers.
  const MIN_VISIBILITY = 0.5;
  const validateFullBody = (landmarks: Landmark[]): boolean => {
    if (landmarks.length !== 33) return false;
    const required = [11, 12, 23, 24, 25, 26, 27, 28]; // shoulders, hips, knees, ankles
    return required.every((i) => (landmarks[i]?.visibility ?? 0) >= MIN_VISIBILITY);
  };

  // Shared finalize path: compute measurements from landmarks, show them, and
  // persist. `source` tailors the retry guidance (retake vs. upload another).
  const finalizeLandmarks = (landmarks: Landmark[], source: 'camera' | 'photo') => {
    if (!validateFullBody(landmarks)) {
      setMeasurements(null);
      updateStatus(
        source === 'photo'
          ? 'We can\'t see your full body. Please try a different photo, head to toe.'
          : 'We can\'t see your full body. Step back so we can see head to toe.',
        'error',
      );
      return;
    }
    const result = calculateMeasurements(landmarks);
    setMeasurements(result);
    updateStatus('Got it! Here are your measurements.', 'success');
    void persistMeasurement(result, landmarks);
  };

  // Run pose detection on an uploaded still image (e.g. a full-body photo).
  const handlePhotoUpload = async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        updateStatus('Please choose a photo.', 'error');
        return;
      }
      updateStatus('Checking your photo…', 'info');
      const pose = await ensurePose();

      const image = new Image();
      image.crossOrigin = 'anonymous';
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('We couldn\'t open that photo'));
        image.src = objectUrl;
      });

      // A full-body pose needs enough resolution. Tiny thumbnails (e.g. a
      // 275x183 avatar) can't yield reliable landmarks — ask for a better one.
      if (image.naturalWidth < 400 || image.naturalHeight < 400) {
        URL.revokeObjectURL(objectUrl);
        updateStatus('This photo is too small. Please try a bigger, clearer one.', 'error');
        return;
      }

      // Draw the uploaded photo into the preview canvas.
      if (canvasRef.current) {
        canvasRef.current.width = image.naturalWidth;
        canvasRef.current.height = image.naturalHeight;
        const ctx = canvasRef.current.getContext('2d');
        ctx?.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
      }

      let captured: Landmark[] = [];
      pose.onResults((results) => {
        if (results.poseLandmarks) {
          captured = results.poseLandmarks.map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
            visibility: lm.visibility ?? 1,
          }));
        }
      });

      await pose.send({ image });
      URL.revokeObjectURL(objectUrl);

      // Show the photo (not a live camera) as the backdrop for the result.
      setPhotoMode(true);
      finalizeLandmarks(captured, 'photo');
    } catch (error) {
      console.error('Error processing photo:', error);
      updateStatus('Something went wrong. Please try a different photo.', 'error');
    }
  };

  const onPoseResults = (results: MediaPipeResults) => {
    if (!canvasRef.current || !videoRef.current || !mediaPipeRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    const { drawConnectors, drawLandmarks, POSE_CONNECTIONS } = mediaPipeRef.current;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.poseLandmarks) {
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4,
      });
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
      });
    }

    canvasCtx.restore();
  };

  const startCamera = async () => {
    try {
      updateStatus('Starting camera…', 'info');
      setPhotoMode(false);

      if (!videoRef.current || !canvasRef.current) return;

      const pose = await ensurePose();
      const mediaPipe = mediaPipeRef.current!;
      pose.onResults(onPoseResults);

      const camera = new mediaPipe.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            await pose.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
        facingMode,
      });

      await camera.start();
      cameraRef.current = camera;
      setIsActive(true);

      updateStatus('Stand back so we can see you, then tap Capture.', 'success');
    } catch (error) {
      console.error('Error starting camera:', error);
      updateStatus('We can\'t open your camera. Please allow camera access and try again.', 'error');
    }
  };

  const captureMeasurements = async () => {
    try {
      updateStatus('Measuring…', 'info');

      if (!videoRef.current || !poseRef.current) {
        updateStatus('Camera isn\'t ready yet. Please wait a moment.', 'error');
        return;
      }

      await poseRef.current.send({ image: videoRef.current });

      setTimeout(async () => {
        if (!videoRef.current) return;

        const pose = poseRef.current;
        if (!pose) return;

        let capturedLandmarks: Landmark[] = [];

        const captureCallback = (results: MediaPipeResults) => {
          if (results.poseLandmarks) {
            capturedLandmarks = results.poseLandmarks.map((lm) => ({
              x: lm.x,
              y: lm.y,
              z: lm.z,
              visibility: lm.visibility ?? 1,
            }));
          }
        };

        pose.onResults(captureCallback);
        await pose.send({ image: videoRef.current });

        finalizeLandmarks(capturedLandmarks, 'camera');

        pose.onResults(onPoseResults);
      }, 500);
    } catch (error) {
      console.error('Error capturing measurements:', error);
      updateStatus('Something went wrong. Please try again.', 'error');
    }
  };

  const flipCamera = async () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }

    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
    setIsActive(false);

    setTimeout(() => {
      startCamera();
    }, 500);
  };

  const downloadMeasurements = () => {
    if (!measurements) return;

    const dataStr = JSON.stringify(measurements, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'measurements.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r text-white p-6 text-center" style={{background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)'}}>
          <h1 className="text-3xl font-bold mb-2">Body Measurement Scanner</h1>
          <p className="text-white">AI-powered measurement using MediaPipe Pose</p>
        </div>

        {status && (
          <div
            className={`p-4 ${
              statusType === 'success'
                ? 'bg-success/10 text-success'
                : statusType === 'error'
                ? 'bg-error/10 text-error'
                  : 'bg-primary/10 text-primary'
            }`}
          >
            {status}
          </div>
        )}

        <div className="p-6">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              style={{ display: isActive && !photoMode ? 'block' : 'none' }}
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ display: isActive || photoMode ? 'block' : 'none' }}
            />
            {!isActive && !photoMode && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <CameraIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Click &quot;Start Camera&quot; to begin</p>
                </div>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePhotoUpload(file);
              e.target.value = '';
            }}
          />

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            {!isActive ? (
              <>
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:brightness-95 font-medium"
                >
                  Start Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:brightness-95 font-medium flex items-center"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Photo
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={captureMeasurements}
                    className="px-6 py-3 bg-accent text-white rounded-lg hover:brightness-95 font-medium"
                >
                  Capture Measurements
                </button>
                <button
                  onClick={flipCamera}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:brightness-95 font-medium flex items-center"
                >
                  <RotateCcw className="mr-2 h-5 w-5" />
                  Flip Camera
                </button>
              </>
            )}
          </div>
        </div>

        {measurements && (
          <div className="p-6 bg-gray-50 border-t">
            <h2 className="text-2xl font-bold mb-4">Your Measurements</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600">Chest</p>
                <p className="text-2xl font-bold">{measurements.chestInches}&quot;</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600">Waist</p>
                <p className="text-2xl font-bold">{measurements.waistInches}&quot;</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600">Hips</p>
                <p className="text-2xl font-bold">{measurements.hipsInches}&quot;</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600">Inseam</p>
                <p className="text-2xl font-bold">{measurements.inseamInches}&quot;</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600">Sleeve Length</p>
                <p className="text-2xl font-bold">{measurements.sleeveLengthInches}&quot;</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-gray-600">Height</p>
                <p className="text-2xl font-bold">{measurements.heightInches}&quot;</p>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg mb-4">
              <p className="text-sm text-foreground">Recommended Size</p>
              <p className="text-3xl font-bold text-primary">{measurements.recommendedSize}</p>
              <p className="text-sm text-foreground mt-1">{measurements.fitNote}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confidence: {measurements.confidencePercent}%</p>
                <p className="text-sm text-gray-600">{measurements.accuracyNote}</p>
              </div>
              <button
                onClick={downloadMeasurements}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:brightness-95 font-medium flex items-center"
              >
                <Download className="mr-2 h-5 w-5" />
                Download JSON
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Tips</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-600">
          <li>Use your camera, or upload a full-body photo</li>
          <li>Stand back so we can see you head to toe</li>
          <li>Find good lighting and a plain background</li>
          <li>Stand straight with arms slightly out</li>
        </ol>
      </div>
    </div>
  );
}
