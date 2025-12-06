export interface CompressionSettings {
  quality: number; // 0.1 to 1.0
  format: 'image/jpeg' | 'image/png' | 'image/webp';
  resizeMode: 'scale' | 'width';
  scale: number; // 0.1 to 1.0
  maxWidth: number; // e.g. 1920
}

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  size: number;
  width: number;
  height: number;
}

export interface AnalysisResult {
  recommendedQuality: number;
  recommendedFormat: 'image/jpeg' | 'image/png' | 'image/webp';
  recommendedScale: number;
  predictedClarityScore: number; // 0-100
  reasoning: string;
}

export interface FileState {
  original: File;
  previewUrl: string;
  originalSize: number;
  originalDimensions: { width: number; height: number };
}