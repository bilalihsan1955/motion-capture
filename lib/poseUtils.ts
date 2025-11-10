export interface TitikKunciPose {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name?: string;
}

export interface DataPose {
  keypoints: TitikKunciPose[];
  score?: number;
}

// Normalize keypoints untuk perbandingan yang lebih baik
export function normalisasiPose(pose: DataPose, lebar: number, tinggi: number): DataPose {
  return {
    ...pose,
    keypoints: pose.keypoints.map((kp) => ({
      ...kp,
      x: kp.x / lebar,
      y: kp.y / tinggi,
    })),
  };
}

// Hitung jarak Euclidean antara dua keypoints
function jarakEuclidean(
  kp1: TitikKunciPose,
  kp2: TitikKunciPose
): number {
  const dx = (kp1.x || 0) - (kp2.x || 0);
  const dy = (kp1.y || 0) - (kp2.y || 0);
  const dz = (kp1.z || 0) - (kp2.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Hitung kemiripan antara dua pose menggunakan Euclidean distance
export function hitungKemiripan(
  pose1: DataPose,
  pose2: DataPose
): number {
  if (!pose1.keypoints || !pose2.keypoints || pose1.keypoints.length !== pose2.keypoints.length) {
    return 0;
  }

  let totalDistance = 0;
  let validKeypoints = 0;

  for (let i = 0; i < pose1.keypoints.length; i++) {
    const kp1 = pose1.keypoints[i];
    const kp2 = pose2.keypoints[i];

    // Hanya hitung keypoints yang memiliki confidence score cukup
    if (
      (kp1.score !== undefined && kp1.score > 0.3) &&
      (kp2.score !== undefined && kp2.score > 0.3)
    ) {
      totalDistance += jarakEuclidean(kp1, kp2);
      validKeypoints++;
    }
  }

  if (validKeypoints === 0) {
    return 0;
  }

  const averageDistance = totalDistance / validKeypoints;

  // Konversi distance ke similarity score (0-100)
  // Semakin kecil distance, semakin tinggi similarity
  // Using inverse relationship dengan scaling
  const maxDistance = 0.3; // Maximum expected normalized distance
  const similarity = Math.max(
    0,
    Math.min(100, 100 * (1 - averageDistance / maxDistance))
  );

  return similarity;
}

// Dapatkan teks assessment berdasarkan score
export function dapatkanTeksPenilaian(skor: number): {
  classification: string;
} {
  if (skor >= 90) {
    return { classification: 'Excellent' };
  } else if (skor >= 80) {
    return { classification: 'Very Good' };
  } else if (skor >= 70) {
    return { classification: 'Good' };
  } else if (skor >= 60) {
    return { classification: 'Fair' };
  } else if (skor >= 50) {
    return { classification: 'Poor' };
  } else {
    return { classification: 'Very Poor' };
  }
}

// Export dengan nama lama untuk backward compatibility (jika diperlukan)
export type PoseKeypoint = TitikKunciPose;
export type PoseData = DataPose;
export const normalizePose = normalisasiPose;
export const calculateSimilarity = hitungKemiripan;
export const getAssessmentText = dapatkanTeksPenilaian;
