'use client';

import { useEffect } from 'react';

interface ScoreModalProps {
  score: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ScoreModal({ score, isOpen, onClose }: ScoreModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto close setelah 3 detik
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl transform transition-all animate-scale-in">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
            Nilai Anda
          </h2>
          <div className="text-9xl font-bold text-blue-600 dark:text-blue-400 mb-4 animate-pulse">
            {Math.round(score)}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">dari 100</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}



