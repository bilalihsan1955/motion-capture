'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import PoseCapture from './PoseCapture';
import {
  PoseData,
  normalizePose,
  calculateSimilarity,
  getAssessmentText,
} from '@/lib/poseUtils';

export default function PoseAssessment() {
  const [referencePose, setReferencePose] = useState<PoseData | null>(null);
  const [currentPose, setCurrentPose] = useState<PoseData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturingReference, setIsCapturingReference] = useState(false);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);

  // Use refs untuk state yang digunakan dalam callback
  const isRecordingRef = useRef(isRecording);
  const isCapturingReferenceRef = useRef(isCapturingReference);

  // Update refs ketika state berubah
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isCapturingReferenceRef.current = isCapturingReference;
  }, [isRecording, isCapturingReference]);

  // Throttle untuk mengurangi update frequency
  const lastUpdateTime = useRef(0);
  const THROTTLE_MS = 100; // Update maksimal setiap 100ms

  const handlePoseDetected = useCallback((pose: PoseData | null) => {
    const now = Date.now();
    
    // Throttle update untuk menghindari terlalu banyak re-render
    if (now - lastUpdateTime.current < THROTTLE_MS && pose !== null) {
      return;
    }

    if (isCapturingReferenceRef.current) {
      // Normalize pose berdasarkan canvas size
      if (pose) {
        const normalized = normalizePose(pose, 640, 480);
        setReferencePose(normalized);
        setIsCapturingReference(false);
        lastUpdateTime.current = now;
      }
    } else if (isRecordingRef.current) {
      // Normalize current pose
      if (pose) {
        const normalized = normalizePose(pose, 640, 480);
        setCurrentPose(normalized);
        lastUpdateTime.current = now;
      } else {
        setCurrentPose(null);
      }
    }
  }, []); // Empty dependency array karena menggunakan refs

  useEffect(() => {
    if (referencePose && currentPose && isRecording) {
      const score = calculateSimilarity(referencePose, currentPose);
      setSimilarityScore(score);
    } else {
      setSimilarityScore(null);
    }
  }, [referencePose, currentPose, isRecording]);

  const handleCaptureReference = () => {
    setIsCapturingReference(true);
    setIsRecording(false);
    setSimilarityScore(null);
    setCurrentPose(null);
  };

  const handleStartAssessment = () => {
    if (referencePose) {
      setIsRecording(true);
      setIsCapturingReference(false);
    }
  };

  const handleStop = () => {
    setIsRecording(false);
    setIsCapturingReference(false);
  };

  const assessment = similarityScore !== null ? getAssessmentText(similarityScore) : null;

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Penilaian Kemiripan Pose
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Capture pose referensi dan bandingkan dengan pose Anda secara real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reference Pose */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Pose Referensi
            </h2>
            {referencePose && (
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Tersimpan
              </span>
            )}
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[360px] flex items-center justify-center">
            {referencePose ? (
              <div className="text-center">
                <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-500 dark:text-gray-400">
                    Pose Referensi Tersimpan
                  </span>
                </div>
                <button
                  onClick={() => {
                    setReferencePose(null);
                    setIsRecording(false);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Reset Referensi
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Belum ada pose referensi
                </p>
                <button
                  onClick={handleCaptureReference}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Capture Pose Referensi
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Current Pose */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Pose Saat Ini
            </h2>
            {isRecording && (
              <span className="text-sm text-red-600 dark:text-red-400 font-medium animate-pulse">
                ● Merekam
              </span>
            )}
          </div>
          <PoseCapture
            onPoseDetected={handlePoseDetected}
            isRecording={isRecording || isCapturingReference}
          />
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!referencePose ? (
          <button
            onClick={handleCaptureReference}
            disabled={isCapturingReference}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            {isCapturingReference ? 'Menangkap...' : 'Capture Pose Referensi'}
          </button>
        ) : (
          <>
            {!isRecording ? (
              <button
                onClick={handleStartAssessment}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Mulai Penilaian
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Hentikan Penilaian
              </button>
            )}
          </>
        )}
      </div>

      {/* Assessment Result */}
      {assessment && similarityScore !== null && (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700">
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold">
              <span className={assessment.color}>{similarityScore.toFixed(1)}%</span>
            </div>
            <div className="text-4xl font-semibold">
              <span className={assessment.color}>{assessment.grade}</span>
            </div>
            <p className={`text-xl ${assessment.color} font-medium`}>
              {assessment.message}
            </p>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-300 ${
                    similarityScore >= 80
                      ? 'bg-green-500'
                      : similarityScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${similarityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Cara Menggunakan:
        </h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
          <li>Izinkan akses webcam ketika diminta</li>
          <li>Klik "Capture Pose Referensi" untuk menyimpan pose yang ingin ditiru</li>
          <li>Klik "Mulai Penilaian" untuk membandingkan pose Anda dengan referensi</li>
          <li>Pose akan dinilai secara real-time dengan skor 0-100%</li>
        </ol>
      </div>
    </div>
  );
}

