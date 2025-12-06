import { CompressionResult, CompressionSettings } from '../types';

export const compressImage = async (
  file: File, 
  settings: CompressionSettings
): Promise<CompressionResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error("无法创建 Canvas 上下文"));
          return;
        }

        // Calculate dimensions based on mode
        let width = img.width;
        let height = img.height;

        if (settings.resizeMode === 'scale') {
            width = Math.floor(img.width * settings.scale);
            height = Math.floor(img.height * settings.scale);
        } else if (settings.resizeMode === 'width') {
            if (img.width > settings.maxWidth) {
                const ratio = settings.maxWidth / img.width;
                width = settings.maxWidth;
                height = Math.floor(img.height * ratio);
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Better quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        const format = settings.format;
        const quality = settings.quality;

        const dataUrl = canvas.toDataURL(format, quality);
        
        // Convert DataURL to Blob to get accurate size
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            resolve({
              blob,
              dataUrl,
              size: blob.size,
              width,
              height
            });
          })
          .catch(reject);
      };
      
      img.onerror = (err) => reject(new Error("图片加载失败"));
    };
    
    reader.onerror = (err) => reject(new Error("文件读取失败"));
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};