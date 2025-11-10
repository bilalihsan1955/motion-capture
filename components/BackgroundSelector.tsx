'use client';

import { useState } from 'react';
import { BackgroundType, VirtualBackgroundConfig } from '@/hooks/useVirtualBackground';

interface BackgroundSelectorProps {
  onConfigChange: (config: VirtualBackgroundConfig) => void;
  currentConfig: VirtualBackgroundConfig;
}

export default function BackgroundSelector({
  onConfigChange,
  currentConfig,
}: BackgroundSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const presetBackgrounds = [
    {
      id: 'museum1',
      name: 'Museum 1',
      url: '/backgrounds/museum1.jpg',
      thumbnail: '/backgrounds/museum1-thumb.jpg',
    },
    {
      id: 'museum2',
      name: 'Museum 2',
      url: '/backgrounds/museum2.jpg',
      thumbnail: '/backgrounds/museum2-thumb.jpg',
    },
    {
      id: 'gallery',
      name: 'Gallery',
      url: '/backgrounds/gallery.jpg',
      thumbnail: '/backgrounds/gallery-thumb.jpg',
    },
  ];

  const handleTypeChange = (type: BackgroundType) => {
    onConfigChange({
      ...currentConfig,
      type,
    });
  };

  const handleImageSelect = (imageUrl: string) => {
    onConfigChange({
      ...currentConfig,
      type: 'image',
      imageUrl,
    });
  };

  const handleBlurAmountChange = (amount: number) => {
    onConfigChange({
      ...currentConfig,
      type: 'blur',
      blurAmount: amount,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">
            Virtual Background
          </span>
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
          {/* Background Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipe Background
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleTypeChange('none')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentConfig.type === 'none'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tidak Ada
              </button>
              <button
                onClick={() => handleTypeChange('blur')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentConfig.type === 'blur'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Blur
              </button>
              <button
                onClick={() => handleTypeChange('image')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentConfig.type === 'image'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Gambar
              </button>
            </div>
          </div>

          {/* Blur Amount Slider */}
          {currentConfig.type === 'blur' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Intensitas Blur: {currentConfig.blurAmount || 10}px
              </label>
              <input
                type="range"
                min="5"
                max="30"
                step="5"
                value={currentConfig.blurAmount || 10}
                onChange={(e) => handleBlurAmountChange(Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {/* Image Selection */}
          {currentConfig.type === 'image' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Pilih Background
              </label>
              <div className="grid grid-cols-3 gap-2">
                {presetBackgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => handleImageSelect(bg.url)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      currentConfig.imageUrl === bg.url
                        ? 'border-blue-600 ring-2 ring-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {bg.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                💡 Tip: Letakkan gambar background di folder public/backgrounds/
              </p>
            </div>
          )}

          {/* Quality Setting */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Kualitas
            </label>
            <select
              value={currentConfig.quality || 'medium'}
              onChange={(e) =>
                onConfigChange({
                  ...currentConfig,
                  quality: e.target.value as 'low' | 'medium' | 'high',
                })
              }
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100"
            >
              <option value="low">Rendah (Perangkat Lemah)</option>
              <option value="medium">Sedang (Rekomendasi)</option>
              <option value="high">Tinggi (Perangkat Kuat)</option>
            </select>
          </div>

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ℹ Virtual background akan diproses secara real-time. Pilih kualitas rendah untuk
              performa lebih baik pada perangkat dengan spesifikasi terbatas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
