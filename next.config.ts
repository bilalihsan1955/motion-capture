import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack config untuk TensorFlow.js (saat menggunakan --webpack flag)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
      // Replace MediaPipe dengan stub
      config.resolve.alias = {
        ...config.resolve.alias,
        '@mediapipe/pose': require.resolve('./lib/mediapipe-pose-stub.js'),
        '@mediapipe/pose/pose.js': require.resolve('./lib/mediapipe-pose-stub.js'),
      };
    }
    return config;
  },
  // Turbopack config - replace MediaPipe dengan stub
  turbopack: {
    resolveAlias: {
      '@mediapipe/pose': './lib/mediapipe-pose-stub.mjs',
      '@mediapipe/pose/pose.js': './lib/mediapipe-pose-stub.mjs',
    },
  },
};

export default nextConfig;
