import { useEffect, useRef, useState } from 'react';

// Dynamic import untuk TensorFlow.js
let deteksiPose: any = null;

async function muatDeteksiPose() {
  if (!deteksiPose) {
    const tfjs = await import('@tensorflow/tfjs');
    await tfjs.ready();
    const pd = await import('@tensorflow-models/pose-detection');
    deteksiPose = {
      SupportedModels: pd.SupportedModels,
      createDetector: pd.createDetector,
      movenet: pd.movenet,
    };
  }
  return deteksiPose;
}

interface OpsiUsePengambilanPose {
  lebar?: number;
  tinggi?: number;
  onPoseTerdeteksi: (pose: any) => void;
  sedangMerekam: boolean;
  throttleMs?: number;
}

/**
 * Custom hook untuk handle pose capture logic
 * Memisahkan TensorFlow.js initialization dan pose detection dari UI
 */
export function usePengambilanPose({
  lebar = 640,
  tinggi = 480,
  onPoseTerdeteksi,
  sedangMerekam,
  throttleMs = 50,
}: OpsiUsePengambilanPose) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<any>(null);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const onPoseTerdeteksiRef = useRef(onPoseTerdeteksi);
  const sedangMerekamRef = useRef(sedangMerekam);
  const waktuCallbackTerakhirRef = useRef<number>(0);

  useEffect(() => {
    onPoseTerdeteksiRef.current = onPoseTerdeteksi;
    sedangMerekamRef.current = sedangMerekam;
  }, [onPoseTerdeteksi, sedangMerekam]);

  useEffect(() => {
    async function init() {
      try {
        const tf = await muatDeteksiPose();
        if (!tf) throw new Error('Failed to load pose detection');

        const konfigurasiDetector = {
          modelType: tf.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableSmoothing: true,
          minPoseScore: 0.25,
        };

        const detector = await tf.createDetector(
          tf.SupportedModels.MoveNet,
          konfigurasiDetector
        );

        detectorRef.current = detector;
        setSedangMemuat(false);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: lebar, height: tinggi },
        });

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

    init();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [lebar, tinggi]);

  useEffect(() => {
    if (sedangMemuat) return;

    let animationFrameId: number;

    function gambarVideo() {
      if (!videoRef.current || !canvasRef.current) {
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

      try {
        ctx.drawImage(video, 0, 0, lebar, tinggi);

        if (sedangMerekamRef.current && detectorRef.current) {
          detectorRef.current.estimatePoses(video).then((poses: any[]) => {
            if (poses && poses.length > 0) {
              const pose = poses[0];

              requestAnimationFrame(() => {
                if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
                  ctx.drawImage(video, 0, 0, lebar, tinggi);
                }

                const dataPose = {
                  keypoints: pose.keypoints.map((kp: any) => ({
                    x: kp.x,
                    y: kp.y,
                    z: kp.z,
                    score: kp.score,
                    name: kp.name,
                  })),
                  score: pose.score,
                };

                const sekarang = Date.now();
                if (sekarang - waktuCallbackTerakhirRef.current >= throttleMs) {
                  waktuCallbackTerakhirRef.current = sekarang;
                  onPoseTerdeteksiRef.current(dataPose);
                }
              });
            } else {
              onPoseTerdeteksiRef.current(null);
            }
          }).catch((err: any) => {
            console.error('Error detecting pose:', err);
          });
        }
      } catch (err) {
        console.error('Error drawing video:', err);
      }

      animationFrameId = requestAnimationFrame(gambarVideo);
    }

    gambarVideo();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [sedangMemuat, lebar, tinggi, throttleMs]);

  return {
    videoRef,
    canvasRef,
    sedangMemuat,
    error,
  };
}


