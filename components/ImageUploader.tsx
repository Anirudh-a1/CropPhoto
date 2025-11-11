
import React, { useRef, useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onImageUpload(Array.from(event.target.files));
      event.target.value = ''; // Reset to allow re-uploading the same files
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (isEntering) {
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    } else {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImageUpload(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [onImageUpload]);

  return (
    <div
      onClick={handleUploadClick}
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => handleDragEvents(e, true)}
      onDrop={handleDrop}
      className={`relative flex flex-col justify-center items-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 
      ${isDragging ? 'border-purple-500 bg-slate-700/50' : 'border-slate-600 hover:border-purple-500 hover:bg-slate-700/50'}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        multiple
      />
      <div className="text-center">
        <UploadIcon />
        <p className="mt-2 text-sm text-slate-300">
          <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-slate-500">Upload one or more images (PNG, JPG, WEBP)</p>
      </div>
    </div>
  );
};
