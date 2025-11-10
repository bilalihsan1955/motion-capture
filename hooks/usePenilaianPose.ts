import { useCallback, useEffect, useRef } from 'react';
import { DataPose, normalisasiPose, hitungKemiripan } from '@/lib/poseUtils';
import { LEBAR_NORMALISASI_POSE, TINGGI_NORMALISASI_POSE } from '@/constants/penilaian';

interface OpsiUsePenilaianPose {
  sudahMulai: boolean;
  poseReferensi: DataPose | null;
  onSkorDihitung: (skor: number) => void;
  onPenilaianSelesai: () => void;
  durasiPenilaian?: number;
}

/**
 * Custom hook untuk handle pose assessment logic
 * Memisahkan semua logic assessment dari UI component
 */
export function usePenilaianPose({
  sudahMulai,
  poseReferensi,
  onSkorDihitung,
  onPenilaianSelesai,
  durasiPenilaian = 6000,
}: OpsiUsePenilaianPose) {
  const poseTertangkapRef = useRef<DataPose | null>(null);
  const seharusnyaLoopRef = useRef(false);
  const isTerkunciRef = useRef(false);
  const sudahMulaiRef = useRef(sudahMulai);
  const poseReferensiRef = useRef(poseReferensi);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs untuk menghindari stale closure
  useEffect(() => {
    sudahMulaiRef.current = sudahMulai;
    poseReferensiRef.current = poseReferensi;
  }, [sudahMulai, poseReferensi]);

  const handlePoseTerdeteksi = useCallback(
    (pose: DataPose | null) => {
      if (!sudahMulaiRef.current || !poseReferensiRef.current || !pose) return;
      if (isTerkunciRef.current || seharusnyaLoopRef.current || poseTertangkapRef.current !== null) {
        return;
      }

      // Atomic lock
      isTerkunciRef.current = true;
      seharusnyaLoopRef.current = true;

      // Process pose
      const poseTernormalisasi = normalisasiPose(pose, LEBAR_NORMALISASI_POSE, TINGGI_NORMALISASI_POSE);
      poseTertangkapRef.current = poseTernormalisasi;
      const skor = hitungKemiripan(poseReferensiRef.current, poseTernormalisasi);

      // Callback dengan score
      onSkorDihitung(skor);

      // Auto clear setelah duration
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        poseTertangkapRef.current = null;
        seharusnyaLoopRef.current = false;
        isTerkunciRef.current = false;
        onPenilaianSelesai();
      }, durasiPenilaian);
    },
    [onSkorDihitung, onPenilaianSelesai, durasiPenilaian]
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    poseTertangkapRef.current = null;
    seharusnyaLoopRef.current = false;
    isTerkunciRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    handlePoseTerdeteksi,
    reset,
    sedangMemprosesRef: seharusnyaLoopRef,
  };
}

