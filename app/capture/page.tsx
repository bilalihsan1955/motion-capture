'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PengambilanPose from '@/components/PengambilanPose';
import CountdownTimer from '@/components/CountdownTimer';
import { DataPose, normalisasiPose } from '@/lib/poseUtils';
import { LEBAR_NORMALISASI_POSE, TINGGI_NORMALISASI_POSE } from '@/constants/penilaian';

export default function HalamanCapture() {
  const router = useRouter();
  const [poseTertangkap, setPoseTertangkap] = useState<DataPose | null>(null);
  const [sedangMenangkap, setSedangMenangkap] = useState(false);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  const handlePoseTerdeteksi = (pose: DataPose | null) => {
    // Capture setelah countdown selesai dan masih dalam mode capturing
    if (pose && sedangMenangkap && !isCountdownActive) {
      const poseTernormalisasi = normalisasiPose(pose, LEBAR_NORMALISASI_POSE, TINGGI_NORMALISASI_POSE);
      setPoseTertangkap(poseTernormalisasi);
      setSedangMenangkap(false);
    }
  };

  const handleCapture = () => {
    setSedangMenangkap(true);
    setIsCountdownActive(true);
    setPoseTertangkap(null);
  };

  const handleCountdownSelesai = () => {
    setIsCountdownActive(false);
    // Setelah countdown selesai, pose akan otomatis di-capture pada frame berikutnya
  };

  const handleSimpan = () => {
    if (poseTertangkap) {
      // Simpan ke localStorage dan langsung redirect ke halaman penilaian
      localStorage.setItem('referencePose', JSON.stringify(poseTertangkap));
      router.push('/');
    }
  };

  // Auto-save dan redirect setelah capture
  useEffect(() => {
    if (poseTertangkap && !sedangMenangkap) {
      // Auto-save setelah 500ms untuk memberikan feedback visual
      const timer = setTimeout(() => {
        localStorage.setItem('referencePose', JSON.stringify(poseTertangkap));
        router.push('/');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [poseTertangkap, sedangMenangkap, router]);

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Capture Pose Referensi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Posisikan diri Anda sesuai pose yang ingin dijadikan referensi
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="relative w-full max-w-md aspect-[5/6] rounded-lg mx-auto">
            <PengambilanPose
              onPoseTerdeteksi={handlePoseTerdeteksi}
              sedangMerekam={true}
            />
            <CountdownTimer
              seconds={5}
              onComplete={handleCountdownSelesai}
              isActive={isCountdownActive}
            />
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleBack}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleCapture}
              disabled={sedangMenangkap || isCountdownActive}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {isCountdownActive
                ? 'Bersiap...'
                : sedangMenangkap
                ? 'Menangkap...'
                : 'Capture Pose'}
            </button>
          </div>

          {poseTertangkap && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-green-700 dark:text-green-300 text-center">
                ✓ Pose berhasil ditangkap! Mengarahkan ke halaman penilaian...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

