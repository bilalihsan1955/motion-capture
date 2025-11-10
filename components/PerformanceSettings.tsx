'use client';

import { useState, useEffect } from 'react';
import {
  PerformanceLevel,
  detectDevicePerformance,
  savePerformancePreference,
  loadPerformancePreference,
} from '@/lib/performanceConfig';

interface PerformanceSettingsProps {
  onLevelChange: (level: PerformanceLevel) => void;
  currentLevel: PerformanceLevel;
}

export default function PerformanceSettings({
  onLevelChange,
  currentLevel,
}: PerformanceSettingsProps) {
  const [detectedLevel, setDetectedLevel] = useState<PerformanceLevel>('medium');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Detect device performance on mount
    const detected = detectDevicePerformance();
    setDetectedLevel(detected);

    // Load saved preference
    const savedLevel = loadPerformancePreference();
    if (savedLevel) {
      onLevelChange(savedLevel);
    } else {
      // Use detected level if no preference saved
      onLevelChange(detected);
    }
  }, [onLevelChange]);

  const handleLevelChange = (level: PerformanceLevel) => {
    onLevelChange(level);
    savePerformancePreference(level);
  };

  const getLevelBadgeColor = (level: PerformanceLevel) => {
    switch (level) {
      case 'low':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'high':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'medium':
      default:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
    }
  };

  const getLevelDescription = (level: PerformanceLevel) => {
    switch (level) {
      case 'low':
        return 'Resolusi rendah, frame skipping aktif, virtual background dinonaktifkan';
      case 'high':
        return 'Resolusi tinggi, semua fitur aktif, kualitas maksimal';
      case 'medium':
      default:
        return 'Resolusi sedang, virtual background aktif, performa seimbang';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              Pengaturan Performa
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Saat ini:{' '}
              <span className="font-semibold capitalize">{currentLevel}</span>
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Auto-detected info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-semibold">Deteksi Otomatis:</span> Perangkat Anda terdeteksi
              sebagai{' '}
              <span className="font-bold capitalize">{detectedLevel}</span> performance
            </p>
          </div>

          {/* Performance Level Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Pilih Level Performa
            </label>

            {/* Low Performance */}
            <button
              onClick={() => handleLevelChange('low')}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                currentLevel === 'low'
                  ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-yellow-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      Rendah
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getLevelBadgeColor('low')}`}>
                      Hemat Resource
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getLevelDescription('low')}
                  </p>
                </div>
                {currentLevel === 'low' && (
                  <span className="text-yellow-600 dark:text-yellow-400 ml-2">✓</span>
                )}
              </div>
            </button>

            {/* Medium Performance */}
            <button
              onClick={() => handleLevelChange('medium')}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                currentLevel === 'medium'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Sedang</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${getLevelBadgeColor('medium')}`}
                    >
                      Rekomendasi
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getLevelDescription('medium')}
                  </p>
                </div>
                {currentLevel === 'medium' && (
                  <span className="text-blue-600 dark:text-blue-400 ml-2">✓</span>
                )}
              </div>
            </button>

            {/* High Performance */}
            <button
              onClick={() => handleLevelChange('high')}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                currentLevel === 'high'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">Tinggi</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${getLevelBadgeColor('high')}`}>
                      Kualitas Maksimal
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getLevelDescription('high')}
                  </p>
                </div>
                {currentLevel === 'high' && (
                  <span className="text-green-600 dark:text-green-400 ml-2">✓</span>
                )}
              </div>
            </button>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              💡 <strong>Tips:</strong> Jika aplikasi terasa lambat atau lag, pilih level "Rendah"
              untuk performa lebih baik. Jika perangkat Anda kuat, pilih "Tinggi" untuk kualitas
              terbaik.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
