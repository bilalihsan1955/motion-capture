'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  seconds: number;
  onComplete: () => void;
  isActive: boolean;
}

export default function CountdownTimer({
  seconds,
  onComplete,
  isActive,
}: CountdownTimerProps) {
  const [countdown, setCountdown] = useState(seconds);

  useEffect(() => {
    if (!isActive) {
      setCountdown(seconds);
      return;
    }

    if (countdown === 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, isActive, onComplete, seconds]);

  if (!isActive) return null;

  return (
    <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-6 py-4 rounded-lg z-30 border-2 border-yellow-400/30">
      <div className="text-center">
        <div className="text-6xl font-bold mb-2 text-yellow-400 animate-pulse">
          {countdown}
        </div>
        <div className="text-lg font-semibold text-yellow-300">
          Bersiap...
        </div>
      </div>
    </div>
  );
}

