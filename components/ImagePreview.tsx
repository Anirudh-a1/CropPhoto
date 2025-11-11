
import React, { forwardRef } from 'react';
import type { CropData } from '../types';

interface ImagePreviewProps {
  src: string | null;
  cropData: CropData | null;
}

export const ImagePreview = forwardRef<HTMLImageElement, ImagePreviewProps>(({ src, cropData }, ref) => {
  if (!src) return null;

  return (
    <div className="relative w-full aspect-square bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center">
      <img ref={ref} src={src} alt="Original" className="max-w-full max-h-full object-contain" />
      {cropData && (
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            top: `${cropData.y * 100}%`,
            left: `${cropData.x * 100}%`,
            width: `${cropData.width * 100}%`,
            height: `${cropData.height * 100}%`,
            outline: '2px dashed #06b6d4'
          }}
        />
      )}
    </div>
  );
});

ImagePreview.displayName = "ImagePreview";
