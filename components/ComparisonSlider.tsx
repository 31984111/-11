import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface ComparisonSliderProps {
  originalUrl: string;
  compressedUrl: string;
  className?: string;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ originalUrl, compressedUrl, className }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, [isResizing]);

  // Touch support
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleTouchMove]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-video overflow-hidden rounded-xl cursor-col-resize select-none border border-slate-700 bg-slate-900 ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* Compressed Image (Background layer) */}
      <img 
        src={compressedUrl} 
        alt="Compressed" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
      />
      
      {/* Original Image (Foreground layer - clipped) */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none border-r-2 border-white/50"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={originalUrl} 
          alt="Original" 
          className="absolute inset-0 w-full h-full max-w-none object-contain"
          // We need to match the parent container dimensions to ensure perfect overlay
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
        />
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10 flex items-center justify-center"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-8 h-8 -ml-3.5 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-900">
           <ArrowLeftRight size={16} />
        </div>
      </div>
      
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
        原图 (Original)
      </div>
      <div className="absolute top-4 right-4 bg-blue-600/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm pointer-events-none">
        压缩后 (Result)
      </div>
    </div>
  );
};