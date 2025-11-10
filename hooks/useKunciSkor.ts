import { useCallback, useRef, useState } from 'react';

/**
 * Custom hook untuk manage score locking mechanism
 * Mencegah score berubah setelah pertama kali di-set
 */
export function useKunciSkor() {
  const [skorTampilan, setSkorTampilanState] = useState<number | null>(null);
  const isSkorTampilanTerkunciRef = useRef(false);
  const isSkorTerkunciRef = useRef(false);
  const skorFinalRef = useRef<number | null>(null);
  const skorTerakhirRef = useRef<number | null>(null);

  const setSkorTampilan = useCallback((skor: number | null) => {
    if (skor === null) {
      isSkorTampilanTerkunciRef.current = false;
      setSkorTampilanState(null);
      return;
    }
    if (isSkorTampilanTerkunciRef.current) {
      console.log('[DISPLAY LOCKED] Attempt to update skorTampilan blocked:', skor);
      return;
    }
    setSkorTampilanState(skor);
  }, []);

  const kunciSkorTampilan = useCallback(() => {
    isSkorTampilanTerkunciRef.current = true;
  }, []);

  const setSkorFinal = useCallback((skor: number) => {
    skorFinalRef.current = skor;
    skorTerakhirRef.current = skor;
  }, []);

  const hapusSemua = useCallback(() => {
    skorFinalRef.current = null;
    skorTerakhirRef.current = null;
    isSkorTampilanTerkunciRef.current = false;
    isSkorTerkunciRef.current = false;
    setSkorTampilanState(null);
  }, []);

  return {
    skorTampilan,
    setSkorTampilan,
    kunciSkorTampilan,
    setSkorFinal,
    skorFinalRef,
    skorTerakhirRef,
    isSkorTerkunciRef,
    hapusSemua,
  };
}


