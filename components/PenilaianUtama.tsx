'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PengambilanPose from './PengambilanPose';
import PratinjauModel from './PratinjauModel';
import OverlaySkor from './OverlaySkor';
import IndikatorWaktu from './IndikatorWaktu';
import BackgroundSelector from './BackgroundSelector';
import PerformanceSettings from './PerformanceSettings';
import { usePoseReferensi } from '@/hooks/usePoseReferensi';
import { useKunciSkor } from '@/hooks/useKunciSkor';
import { usePenilaianPose } from '@/hooks/usePenilaianPose';
import { VirtualBackgroundConfig } from '@/hooks/useVirtualBackground';
import { PerformanceLevel, getPerformanceConfig } from '@/lib/performanceConfig';
import { KECEPATAN_INDIKATOR_WAKTU, DURASI_PENILAIAN } from '@/constants/penilaian';

export default function PenilaianUtama() {
  const router = useRouter();
  const poseReferensi = usePoseReferensi();
  const [sudahMulai, setSudahMulai] = useState(false);
  const [hitungMundur, setHitungMundur] = useState<number | null>(null);

  // State untuk performance level
  const [performanceLevel, setPerformanceLevel] = useState<PerformanceLevel>('medium');
  const performanceConfig = getPerformanceConfig(performanceLevel);

  // State untuk virtual background
  const [virtualBackgroundConfig, setVirtualBackgroundConfig] = useState<VirtualBackgroundConfig>({
    type: 'none',
    quality: performanceConfig.vbQuality,
  });

  // Update virtual background quality ketika performance level berubah
  useEffect(() => {
    setVirtualBackgroundConfig((prev) => ({
      ...prev,
      quality: performanceConfig.vbQuality,
    }));
  }, [performanceConfig.vbQuality]);

  const {
    skorTampilan,
    setSkorTampilan,
    kunciSkorTampilan,
    setSkorFinal,
    hapusSemua,
  } = useKunciSkor();

  const handleSkorDihitung = useCallback(
    (skor: number) => {
      setSkorFinal(skor);
      setSkorTampilan(skor);
      kunciSkorTampilan();
    },
    [setSkorFinal, setSkorTampilan, kunciSkorTampilan]
  );

  const handlePenilaianSelesai = useCallback(() => {
    // Hapus skor bersamaan dengan tombol reset hilang
    // Durasi tampil nilai = durasi tombol reset = DURASI_PENILAIAN
    setSudahMulai(false);
    hapusSemua();
  }, [hapusSemua]);

  const { handlePoseTerdeteksi, reset, sedangMemprosesRef } = usePenilaianPose({
    sudahMulai,
    poseReferensi,
    onSkorDihitung: handleSkorDihitung,
    onPenilaianSelesai: handlePenilaianSelesai,
    durasiPenilaian: DURASI_PENILAIAN,
  });

  const handleTepukanWaktu = () => {
    if (!poseReferensi) {
      alert('Silakan capture pose referensi terlebih dahulu!');
      router.push('/capture');
      return;
    }
    reset();
    hapusSemua();
    setSudahMulai(true);
    setHitungMundur(null);
  };

  const handlePerubahanZonaBersiap = useCallback((masukZona: boolean, nilaiHitungMundur: number | null) => {
    setHitungMundur(nilaiHitungMundur);
  }, []);

  const handleReset = () => {
    reset();
    hapusSemua();
    setSudahMulai(false);
  };

  // Sinkronisasi: Pastikan skor dihapus ketika sudahMulai menjadi false
  // Ini memastikan konsistensi antara tampilan tombol reset dan nilai
  useEffect(() => {
    if (!sudahMulai && skorTampilan !== null) {
      // Jika tombol reset sudah tidak tampil (sudahMulai = false) tapi nilai masih ada,
      // hapus nilai untuk sinkronisasi
      hapusSemua();
    }
  }, [sudahMulai, skorTampilan, hapusSemua]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Penilaian Kemiripan Pose
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bersiaplah, pose Anda akan dinilai saat penanda melewati tengah
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Preview
            </h2>
            {sudahMulai && (
              <span className="text-sm text-red-600 dark:text-red-400 font-medium animate-pulse">
                ● Merekam
              </span>
            )}
          </div>

          <div className="relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Camera Preview */}
              <div>
                <div className="relative w-full aspect-[5/6] rounded-lg lg:rounded-r-none">
                  <PengambilanPose
                    onPoseTerdeteksi={handlePoseTerdeteksi}
                    sedangMerekam={sudahMulai}
                    virtualBackgroundConfig={virtualBackgroundConfig}
                    enablePerformanceMode={performanceLevel === 'low'}
                  />
                  {hitungMundur !== null && skorTampilan === null && (
                    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-6 py-4 rounded-lg z-30 border-2 border-yellow-400/30">
                      <div className="text-center">
                        <div className="text-6xl font-bold mb-2 text-yellow-400 animate-pulse">
                          {hitungMundur}
                        </div>
                        <div className="text-lg font-semibold text-yellow-300">
                          Bersiap...
                        </div>
                      </div>
                    </div>
                  )}
                  <OverlaySkor skor={skorTampilan} />
                </div>
              </div>

              {/* Model Preview */}
              <div>
                <div className="w-full aspect-[5/6] rounded-lg lg:rounded-l-none">
                  <PratinjauModel pathModel="/model/Memanah.glb" namaModel="Memanah" />
                </div>
              </div>
            </div>

            {/* Timing Indicator Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-20 rounded-bl-lg rounded-br-lg lg:rounded-bl-lg lg:rounded-br-lg">
              <div>
                {poseReferensi && (
                  <div className="bg-black/40 backdrop-blur-sm rounded-bl-lg rounded-br-lg">
                    <IndikatorWaktu
                      onTepukan={handleTepukanWaktu}
                      isAktif={!sedangMemprosesRef.current && !!poseReferensi}
                      kecepatan={KECEPATAN_INDIKATOR_WAKTU}
                      onPerubahanZonaBersiap={handlePerubahanZonaBersiap}
                    />
                  </div>
                )}
                {!sudahMulai && !poseReferensi && (
                  <div className="text-center p-4 bg-yellow-500/20 dark:bg-yellow-900/30 rounded-lg">
                    <p className="text-yellow-200 dark:text-yellow-300 mb-2">
                      ⚠ Silakan capture pose referensi terlebih dahulu
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {sudahMulai && (
              <button
                onClick={handleReset}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Reset
              </button>
            )}
            {!sudahMulai && (
              <Link
                href="/capture"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                {poseReferensi ? 'Ubah Referensi' : 'Capture Referensi'}
              </Link>
            )}

            {poseReferensi ? (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-4 py-2">
                <p className="text-green-700 dark:text-green-300 text-center font-medium">
                  ✓ Pose referensi tersedia
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-4 py-2">
                <p className="text-yellow-700 dark:text-yellow-300 text-center font-medium">
                  ⚠ Belum ada pose referensi
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          {/* Performance Settings */}
          <PerformanceSettings
            currentLevel={performanceLevel}
            onLevelChange={setPerformanceLevel}
          />

          {/* Virtual Background Selector */}
          <BackgroundSelector
            currentConfig={virtualBackgroundConfig}
            onConfigChange={setVirtualBackgroundConfig}
          />
        </div>
      </div>
    </div>
  );
}

