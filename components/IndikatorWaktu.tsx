'use client';

import { useEffect, useRef, useState } from 'react';

interface PropsIndikatorWaktu {
  onTepukan: () => void;
  isAktif: boolean;
  kecepatan?: number; // percentage per frame
  onPerubahanZonaBersiap?: (masukZona: boolean, hitungMundur: number | null) => void; // Callback untuk notify parent tentang countdown
}

export default function IndikatorWaktu({
  onTepukan,
  isAktif,
  kecepatan = 0.08, // Lebih pelan
  onPerubahanZonaBersiap,
}: PropsIndikatorWaktu) {
  const [posisi, setPosisi] = useState(-10); // Start dari kanan (-10%)
  const [hitungMundur, setHitungMundur] = useState<number | null>(null); // Countdown saat masuk zona bersiap
  const animationRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const sudahTertriggerRef = useRef(false);
  const posisiRef = useRef(-10); // Ref untuk position tanpa re-render
  const onTepukanRef = useRef(onTepukan);
  const isAktifRef = useRef(isAktif);
  const kecepatanRef = useRef(kecepatan);
  const hitungMundurIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sebelumnyaDiZonaBersiapRef = useRef(false); // Track apakah sebelumnya di zona bersiap
  const onPerubahanZonaBersiapRef = useRef(onPerubahanZonaBersiap);
  const nilaiHitungMundurTerakhirRef = useRef<number | null>(null); // Track nilai countdown terakhir untuk menghindari update berulang
  
  useEffect(() => {
    onPerubahanZonaBersiapRef.current = onPerubahanZonaBersiap;
  }, [onPerubahanZonaBersiap]);

  // Update refs tanpa menyebabkan re-render atau restart animasi
  useEffect(() => {
    onTepukanRef.current = onTepukan;
    isAktifRef.current = isAktif;
    kecepatanRef.current = kecepatan;
  }, [onTepukan, isAktif, kecepatan]);

  // Timing indicator SELALU berjalan - mount sekali, tidak pernah restart
  useEffect(() => {
    let animationId: number;
    let waktuTerakhir = performance.now();
    let posisiTerakhirDirender = -10; // Track last rendered position

    const animasi = (waktuSaatIni: number) => {
      const deltaWaktu = waktuSaatIni - waktuTerakhir;
      waktuTerakhir = waktuSaatIni;

      // Update position menggunakan ref untuk menghindari re-render yang tidak perlu
      posisiRef.current += kecepatanRef.current * (deltaWaktu / 16.67); // Normalize to ~60fps
      const posisiBaru = posisiRef.current;

      // Update state hanya jika perubahannya cukup signifikan (untuk performa)
      // Update lebih sering untuk smooth animation
      if (Math.abs(posisiBaru - posisiTerakhirDirender) > 0.1 || posisiBaru < -5 || posisiBaru > 105) {
        posisiTerakhirDirender = posisiBaru;
        setPosisi(posisiBaru);
      }

      // Check jika tepat di tengah-tengah garis (49.5-50.5%) - sangat ketat
      if (
        posisiBaru >= 49.5 &&
        posisiBaru <= 50.5 &&
        !sudahTertriggerRef.current &&
        isAktifRef.current
      ) {
        sudahTertriggerRef.current = true;
        // Trigger hit hanya sekali saat tepat di tengah - gunakan requestIdleCallback untuk tidak blocking
        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            onTepukanRef.current();
          }, { timeout: 0 });
        } else {
          setTimeout(() => {
            onTepukanRef.current();
          }, 0);
        }
      }

      // Reset trigger saat tidak aktif (tapi animasi tetap berjalan)
      if (!isAktifRef.current) {
        sudahTertriggerRef.current = false;
      }

      // Reset position jika sudah melewati layar (110%)
      if (posisiBaru > 110) {
        sudahTertriggerRef.current = false;
        posisiRef.current = -10;
        posisiTerakhirDirender = -10;
        setPosisi(-10);
      }

      animationId = requestAnimationFrame(animasi);
    };

    // Start animasi - hanya sekali saat mount
    waktuTerakhir = performance.now();
    animationId = requestAnimationFrame(animasi);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []); // Empty dependency - hanya mount sekali, tidak pernah restart

  // Handle countdown saat masuk zona bersiap - menghitung berdasarkan sisa waktu di zona oranye
  useEffect(() => {
    const AWAL_ZONA_BERSIAP = 30;
    const AKHIR_ZONA_BERSIAP = 49.5;
    const masukZonaBersiap = posisi >= AWAL_ZONA_BERSIAP && posisi < AKHIR_ZONA_BERSIAP;
    
    // Jika baru masuk zona bersiap
    if (masukZonaBersiap && !sebelumnyaDiZonaBersiapRef.current) {
      sebelumnyaDiZonaBersiapRef.current = true;
    }
    
    // Jika di dalam zona bersiap, hitung countdown berdasarkan sisa jarak
    if (masukZonaBersiap) {
      // Hitung progress di zona (0 = baru masuk, 1 = hampir keluar)
      const progress = (posisi - AWAL_ZONA_BERSIAP) / (AKHIR_ZONA_BERSIAP - AWAL_ZONA_BERSIAP);
      
      // Hitung sisa jarak di zona (dalam %)
      const sisaJarak = AKHIR_ZONA_BERSIAP - posisi;
      
      // Hitung waktu yang dibutuhkan berdasarkan speed
      const kecepatanPerDetik = kecepatanRef.current * (1000 / 16.67); // Convert to percentage per second
      
      // Hitung sisa waktu (dalam detik) untuk melewati sisa jarak
      const sisaWaktu = sisaJarak / kecepatanPerDetik;
      
      // Bulatkan ke atas untuk countdown (minimal 1 detik jika masih di zona)
      const nilaiHitungMundur = Math.max(1, Math.ceil(sisaWaktu));
      
      // Update countdown hanya jika berubah (untuk menghindari update berulang)
      if (nilaiHitungMundur !== nilaiHitungMundurTerakhirRef.current || nilaiHitungMundurTerakhirRef.current === null) {
        nilaiHitungMundurTerakhirRef.current = nilaiHitungMundur;
        setHitungMundur(nilaiHitungMundur);
        
        // Notify parent dengan nilai yang dihitung
        if (onPerubahanZonaBersiapRef.current) {
          onPerubahanZonaBersiapRef.current(true, nilaiHitungMundur);
        }
      }
    }
    
    // Jika keluar dari zona bersiap, stop countdown
    if (!masukZonaBersiap && sebelumnyaDiZonaBersiapRef.current) {
      sebelumnyaDiZonaBersiapRef.current = false;
      nilaiHitungMundurTerakhirRef.current = null;
      setHitungMundur(null);
      
      // Notify parent
      if (onPerubahanZonaBersiapRef.current) {
        onPerubahanZonaBersiapRef.current(false, null);
      }
      
      if (hitungMundurIntervalRef.current) {
        clearInterval(hitungMundurIntervalRef.current);
        hitungMundurIntervalRef.current = null;
      }
    }
    
    return () => {
      if (hitungMundurIntervalRef.current) {
        clearInterval(hitungMundurIntervalRef.current);
      }
    };
  }, [posisi]);

  // Tentukan zona berdasarkan posisi
  const masukZonaBersiap = posisi >= 30 && posisi < 49.5;
  const masukZonaTangkap = posisi >= 49.5 && posisi <= 50.5;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-24 bg-transparent rounded-lg overflow-hidden"
    >
      {/* Bersiap Zone (30-45%) */}
      <div className="absolute left-[30%] top-0 bottom-0 w-[15%] bg-yellow-500/20 z-5" />
      <div className="absolute left-[30%] top-0 bottom-0 w-1 -translate-x-1/2 bg-yellow-500 z-10 opacity-60" />
      
      {/* Capture Zone (45-55%) - Center Target */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[10%] -translate-x-1/2 bg-green-500/30 z-5" />
      <div className="absolute left-1/2 top-0 bottom-0 w-2 -translate-x-1/2 bg-green-500 z-20 opacity-80" />
      
      {/* Center Target Circle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-4 border-green-500 rounded-full bg-transparent z-10 animate-pulse" />

      {/* Moving Indicator (from right to left) */}
      <div
        ref={indicatorRef}
        className="absolute w-12 h-12 bg-blue-500 rounded-full shadow-lg z-30 flex items-center justify-center will-change-transform"
        style={{
          left: `${posisi}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'none', // Tidak ada CSS transition - murni JavaScript untuk performa maksimal
        }}
      >
        {/* Inner circle */}
        <div className="w-8 h-8 bg-blue-400 rounded-full" />
      </div>

      {/* Instructions */}
      <div className="absolute top-2 left-4 text-white text-sm font-semibold z-10">
        {masukZonaTangkap ? 'CAPTURE!' : masukZonaBersiap ? 'BERSIAP!' : 'Bersiap... Tahan pose saat melewati penanda!'}
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-2 right-4 z-10">
        {masukZonaTangkap && (
          <div className="text-green-400 text-lg font-bold animate-pulse">
            CAPTURE!
          </div>
        )}
        {masukZonaBersiap && !hitungMundur && (
          <div className="text-yellow-400 text-lg font-bold animate-pulse">
            BERSIAP!
          </div>
        )}
        {posisi < 30 && (
          <div className="text-gray-400 text-sm font-semibold">
            Menunggu...
          </div>
        )}
      </div>
      
    </div>
  );
}

