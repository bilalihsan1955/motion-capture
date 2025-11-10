'use client';

import { useRef, useCallback, useState } from 'react';

// Tipe untuk virtual background
export type BackgroundType = 'none' | 'blur' | 'image';

export interface VirtualBackgroundConfig {
  type: BackgroundType;
  imageUrl?: string;
  blurAmount?: number;
  quality?: 'low' | 'medium' | 'high';
}

// Simplified: Tidak menggunakan body segmentation untuk virtual background
// Karena ada masalah kompatibilitas dengan MediaPipe SelfieSegmentation
// Akan menggunakan teknik sederhana berbasis canvas manipulation

export function useVirtualBackground(config: VirtualBackgroundConfig) {
  const [isLoading] = useState(false);
  const [isReady] = useState(true); // Selalu ready karena menggunakan canvas API
  const backgroundImageRef = useRef<HTMLImageElement | null>(null);

  // Load background image jika diperlukan
  const loadBackgroundImage = useCallback(() => {
    if (config.type === 'image' && config.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        backgroundImageRef.current = img;
      };
      img.onerror = () => {
        console.error('Failed to load background image:', config.imageUrl);
      };
      img.src = config.imageUrl;
    }
  }, [config.type, config.imageUrl]);

  // Initialize (no-op untuk simple version)
  const initializeSegmenter = useCallback(async () => {
    loadBackgroundImage();
  }, [loadBackgroundImage]);

  // Apply virtual background ke canvas (simplified version)
  const applyBackground = useCallback(
    async (
      sourceVideo: HTMLVideoElement,
      targetCanvas: HTMLCanvasElement,
      ctx: CanvasRenderingContext2D
    ) => {
      // Untuk versi sederhana, hanya apply blur atau draw image
      // Tanpa segmentasi real-time (butuh model ML yang lebih kompleks)

      if (config.type === 'none') {
        // Gambar video langsung
        ctx.drawImage(sourceVideo, 0, 0, targetCanvas.width, targetCanvas.height);
        return;
      }

      if (config.type === 'blur') {
        // Apply blur effect
        ctx.filter = `blur(${config.blurAmount || 10}px)`;
        ctx.drawImage(sourceVideo, 0, 0, targetCanvas.width, targetCanvas.height);
        ctx.filter = 'none';
        return;
      }

      if (config.type === 'image' && backgroundImageRef.current) {
        // Untuk sekarang, hanya ganti full background
        // TODO: Implement proper person segmentation dengan model ML
        ctx.drawImage(
          backgroundImageRef.current,
          0,
          0,
          targetCanvas.width,
          targetCanvas.height
        );
        // Draw video dengan opacity untuk blend effect
        ctx.globalAlpha = 0.8;
        ctx.drawImage(sourceVideo, 0, 0, targetCanvas.width, targetCanvas.height);
        ctx.globalAlpha = 1.0;
        return;
      }

      // Fallback
      ctx.drawImage(sourceVideo, 0, 0, targetCanvas.width, targetCanvas.height);
    },
    [config.type, config.blurAmount]
  );

  // Cleanup (no-op untuk simple version)
  const dispose = useCallback(() => {
    backgroundImageRef.current = null;
  }, []);

  return {
    isLoading,
    isReady,
    initializeSegmenter,
    applyBackground,
    dispose,
  };
}
