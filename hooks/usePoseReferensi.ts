import { useEffect, useState } from 'react';
import { DataPose } from '@/lib/poseUtils';

export function usePoseReferensi() {
  const [poseReferensi, setPoseReferensi] = useState<DataPose | null>(null);

  useEffect(() => {
    const poseTersimpan = localStorage.getItem('referencePose');
    if (poseTersimpan) {
      try {
        setPoseReferensi(JSON.parse(poseTersimpan));
      } catch (e) {
        console.error('Error loading reference pose:', e);
      }
    }
  }, []);

  return poseReferensi;
}

