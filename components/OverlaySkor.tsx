'use client';

import { dapatkanTeksPenilaian } from '@/lib/poseUtils';

interface PropsOverlaySkor {
  skor: number | null;
}

export default function OverlaySkor({ skor }: PropsOverlaySkor) {
  if (skor === null) return null;

  const penilaian = dapatkanTeksPenilaian(skor);

  const dapatkanWarnaSkor = () => {
    if (skor >= 90) return 'text-green-400';
    if (skor >= 80) return 'text-green-300';
    if (skor >= 70) return 'text-blue-400';
    if (skor >= 60) return 'text-yellow-400';
    if (skor >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const dapatkanWarnaKlasifikasi = () => {
    if (skor >= 90) return 'text-green-400';
    if (skor >= 80) return 'text-green-300';
    if (skor >= 70) return 'text-blue-400';
    if (skor >= 60) return 'text-yellow-400';
    if (skor >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-6 py-4 rounded-lg z-30 border-2 border-white/30">
      <div className="text-center">
        <div className={`text-6xl font-bold mb-2 ${dapatkanWarnaSkor()}`}>
          {Math.round(skor)}
        </div>
        <div className={`text-lg font-semibold ${dapatkanWarnaKlasifikasi()}`}>
          {penilaian.classification}
        </div>
      </div>
    </div>
  );
}

