'use client';

import { useEffect, useRef, useState } from 'react';
import { DataPose } from '@/lib/poseUtils';
import { useVirtualBackground, VirtualBackgroundConfig } from '@/hooks/useVirtualBackground';

// Dynamic import untuk TensorFlow.js (hanya di client)
// Menggunakan hanya MoveNet untuk menghindari dependency MediaPipe
let deteksiPose: any = null;

async function muatDeteksiPose() {
  if (!deteksiPose) {
    // Import hanya bagian yang diperlukan untuk MoveNet
    const tfjs = await import('@tensorflow/tfjs');
    await tfjs.ready();

    // Import pose-detection secara dinamis
    const pd = await import('@tensorflow-models/pose-detection');

    deteksiPose = {
      SupportedModels: pd.SupportedModels,
      createDetector: pd.createDetector,
      movenet: pd.movenet,
    };
  }
  return deteksiPose;
}

interface PropsPengambilanPose {
  onPoseTerdeteksi: (pose: DataPose | null) => void;
  sedangMerekam: boolean;
  lebar?: number;
  tinggi?: number;
  virtualBackgroundConfig?: VirtualBackgroundConfig;
  enablePerformanceMode?: boolean;
}

export default function PengambilanPose({
  onPoseTerdeteksi,
  sedangMerekam,
  lebar = 640,
  tinggi = 480,
  virtualBackgroundConfig,
  enablePerformanceMode = false,
}: PropsPengambilanPose) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<any>(null);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pastikan width dan height selalu ada nilai default
  const lebarCanvas = lebar ?? 640;
  const tinggiCanvas = tinggi ?? 480;

  // Virtual background hook
  const defaultVBConfig: VirtualBackgroundConfig = virtualBackgroundConfig || {
    type: 'none',
    quality: enablePerformanceMode ? 'low' : 'medium',
  };
  const { isLoading: vbLoading, isReady: vbReady, initializeSegmenter, applyBackground } =
    useVirtualBackground(defaultVBConfig);

  // Performance optimization: Skip frames untuk perangkat lemah
  const frameSkipCounterRef = useRef(0);
  const FRAME_SKIP = enablePerformanceMode ? 2 : 0; // Skip 2 frames jika performance mode aktif

  useEffect(() => {
    async function initDeteksiPose() {
      try {
        // Load TensorFlow.js models
        const tf = await muatDeteksiPose();
        if (!tf) {
          throw new Error('Failed to load pose detection');
        }

        // Initialize MoveNet model - gunakan Lightning untuk performa lebih baik
        const konfigurasiDetector = {
          modelType: tf.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: !enablePerformanceMode, // Disable smoothing untuk performa
          minPoseScore: 0.25,
        };

        const detector = await tf.createDetector(
          tf.SupportedModels.MoveNet,
          konfigurasiDetector
        );

        detectorRef.current = detector;

        // Initialize virtual background jika diperlukan
        if (defaultVBConfig.type !== 'none') {
          await initializeSegmenter();
        }

        setSedangMemuat(false);

        // Start webcam dengan resolusi yang disesuaikan untuk performance mode
        const constraints = {
          video: {
            width: enablePerformanceMode ? Math.min(lebarCanvas, 480) : lebarCanvas,
            height: enablePerformanceMode ? Math.min(tinggiCanvas, 360) : tinggiCanvas,
            frameRate: enablePerformanceMode ? { ideal: 24, max: 30 } : { ideal: 30 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Error initializing pose detection:', err);
        setError('Tidak dapat mengakses webcam atau model tidak tersedia');
        setSedangMemuat(false);
      }
    }

    initDeteksiPose();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [lebarCanvas, tinggiCanvas, enablePerformanceMode, defaultVBConfig.type, initializeSegmenter]);

  // Use ref untuk callback agar tidak menyebabkan re-render
  const onPoseTerdeteksiRef = useRef(onPoseTerdeteksi);
  const sedangMerekamRef = useRef(sedangMerekam);
  const waktuCallbackTerakhirRef = useRef<number>(0);
  const THROTTLE_MS = 50; // Throttle callback untuk mencegah terlalu banyak calls
  
  useEffect(() => {
    onPoseTerdeteksiRef.current = onPoseTerdeteksi;
    sedangMerekamRef.current = sedangMerekam;
  }, [onPoseTerdeteksi, sedangMerekam]);

  // Always draw video frame, regardless of recording state
  // Memastikan dependency array selalu konsisten dengan menggunakan nilai konstan
  useEffect(() => {
    let animationFrameId: number;

    async function gambarVideo() {
      if (!videoRef.current || !canvasRef.current || sedangMemuat) {
        animationFrameId = requestAnimationFrame(gambarVideo);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(gambarVideo);
        return;
      }

      // Frame skipping untuk performance mode
      if (FRAME_SKIP > 0) {
        frameSkipCounterRef.current++;
        if (frameSkipCounterRef.current < FRAME_SKIP) {
          animationFrameId = requestAnimationFrame(gambarVideo);
          return;
        }
        frameSkipCounterRef.current = 0;
      }

      try {
        // Apply virtual background atau draw video langsung
        if (defaultVBConfig.type !== 'none' && vbReady) {
          await applyBackground(video, canvas, ctx);
        } else {
          // Fallback: draw video frame langsung
          ctx.drawImage(video, 0, 0, lebarCanvas, tinggiCanvas);
        }

        // Pose detection di background - tidak memblokir video drawing
        if (sedangMerekamRef.current && detectorRef.current) {
          // Process pose detection asynchronously tanpa memblokir video
          detectorRef.current
            .estimatePoses(video)
            .then((poses) => {
              if (poses && poses.length > 0) {
                const pose = poses[0];

                // Draw keypoints dan skeleton
                requestAnimationFrame(() => {
                  if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
                    // Draw keypoints
                    gambarKeypoints(ctx, pose.keypoints);
                    // Draw skeleton
                    gambarSkeleton(ctx, pose.keypoints);
                  }

                  // Convert to DataPose format
                  const dataPose: DataPose = {
                    keypoints: pose.keypoints.map((kp) => ({
                      x: kp.x,
                      y: kp.y,
                      z: kp.z,
                      score: kp.score,
                      name: kp.name,
                    })),
                    score: pose.score,
                  };

                  // Throttle callback untuk mencegah terlalu banyak calls
                  const sekarang = Date.now();
                  if (sekarang - waktuCallbackTerakhirRef.current >= THROTTLE_MS) {
                    waktuCallbackTerakhirRef.current = sekarang;
                    onPoseTerdeteksiRef.current(dataPose);
                  }
                });
              } else {
                onPoseTerdeteksiRef.current(null);
              }
            })
            .catch((err) => {
              console.error('Error detecting pose:', err);
            });
        }
      } catch (err) {
        console.error('Error drawing video:', err);
      }

      // Always continue drawing video
      animationFrameId = requestAnimationFrame(gambarVideo);
    }

    if (!sedangMemuat) {
      gambarVideo();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sedangMemuat, lebarCanvas, tinggiCanvas, defaultVBConfig.type, vbReady, applyBackground]);

  function gambarKeypoints(
    ctx: CanvasRenderingContext2D,
    keypoints: any[]
  ) {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#00ff00';
        ctx.fill();
      }
    });
  }

  function gambarSkeleton(
    ctx: CanvasRenderingContext2D,
    keypoints: any[]
  ) {
    // Define skeleton connections for MoveNet
    const koneksi: [number, number][] = [
      [0, 1], [0, 2], [1, 3], [2, 4], // Head
      [5, 6], [5, 11], [6, 12], [11, 12], // Torso
      [5, 7], [7, 9], [6, 8], [8, 10], // Arms
      [11, 13], [13, 15], [12, 14], [14, 16], // Legs
    ];

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;

    koneksi.forEach(([startIdx, endIdx]) => {
      const startKp = keypoints[startIdx];
      const endKp = keypoints[endIdx];

      if (
        startKp?.score && startKp.score > 0.3 &&
        endKp?.score && endKp.score > 0.3
      ) {
        ctx.beginPath();
        ctx.moveTo(startKp.x, startKp.y);
        ctx.lineTo(endKp.x, endKp.y);
        ctx.stroke();
      }
    });
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        width={lebar}
        height={tinggi}
        className="hidden"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        width={lebar}
        height={tinggi}
        className="absolute inset-0 w-full h-full object-cover rounded-lg lg:rounded-r-none"
      />
      {sedangMemuat && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg lg:rounded-r-none">
          <p className="text-white">Memuat model pose detection...</p>
        </div>
      )}
    </div>
  );
}

