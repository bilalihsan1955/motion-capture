/**
 * Performance Configuration
 * Clean Architecture: Konfigurasi terpisah untuk performa
 */

export interface PerformanceConfig {
  // Video configuration
  videoWidth: number;
  videoHeight: number;
  frameRate: number;

  // Pose detection configuration
  modelType: 'lightning' | 'thunder';
  enableSmoothing: boolean;
  minPoseScore: number;
  skipFrames: number;

  // Virtual background configuration
  vbQuality: 'low' | 'medium' | 'high';
  vbEnabled: boolean;

  // Canvas rendering
  canvasScale: number;
}

export type PerformanceLevel = 'low' | 'medium' | 'high';

/**
 * Mendapatkan konfigurasi performa berdasarkan level
 */
export function getPerformanceConfig(level: PerformanceLevel): PerformanceConfig {
  switch (level) {
    case 'low':
      return {
        videoWidth: 480,
        videoHeight: 360,
        frameRate: 24,
        modelType: 'lightning',
        enableSmoothing: false,
        minPoseScore: 0.3,
        skipFrames: 2, // Skip 2 frames untuk mengurangi beban
        vbQuality: 'low',
        vbEnabled: false, // Disable virtual background by default untuk low-end
        canvasScale: 0.75,
      };

    case 'high':
      return {
        videoWidth: 800,
        videoHeight: 600,
        frameRate: 30,
        modelType: 'thunder',
        enableSmoothing: true,
        minPoseScore: 0.2,
        skipFrames: 0,
        vbQuality: 'high',
        vbEnabled: true,
        canvasScale: 1.0,
      };

    case 'medium':
    default:
      return {
        videoWidth: 640,
        videoHeight: 480,
        frameRate: 30,
        modelType: 'lightning',
        enableSmoothing: true,
        minPoseScore: 0.25,
        skipFrames: 1,
        vbQuality: 'medium',
        vbEnabled: true,
        canvasScale: 1.0,
      };
  }
}

/**
 * Deteksi performa device secara otomatis
 */
export function detectDevicePerformance(): PerformanceLevel {
  if (typeof window === 'undefined') {
    return 'medium'; // Default untuk SSR
  }

  // Check hardware concurrency (jumlah CPU cores)
  const cores = navigator.hardwareConcurrency || 4;

  // Check device memory (jika tersedia)
  const memory = (navigator as any).deviceMemory || 4; // GB

  // Check user agent untuk mobile devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Scoring system
  let score = 0;

  // CPU cores scoring
  if (cores >= 8) score += 3;
  else if (cores >= 4) score += 2;
  else score += 1;

  // Memory scoring
  if (memory >= 8) score += 3;
  else if (memory >= 4) score += 2;
  else score += 1;

  // Mobile penalty
  if (isMobile) score -= 2;

  // Determine performance level
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/**
 * Hook untuk mendapatkan konfigurasi performa
 */
export function usePerformanceDetection(): {
  level: PerformanceLevel;
  config: PerformanceConfig;
  isMobile: boolean;
} {
  const level = detectDevicePerformance();
  const config = getPerformanceConfig(level);
  const isMobile = typeof window !== 'undefined'
    ? /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    : false;

  return { level, config, isMobile };
}

/**
 * Simpan preferensi performa user
 */
export function savePerformancePreference(level: PerformanceLevel): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('performanceLevel', level);
  }
}

/**
 * Load preferensi performa user
 */
export function loadPerformancePreference(): PerformanceLevel | null {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('performanceLevel');
    if (saved === 'low' || saved === 'medium' || saved === 'high') {
      return saved;
    }
  }
  return null;
}
