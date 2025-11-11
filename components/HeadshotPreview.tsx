
import React from 'react';
import { DownloadIcon, UserCircleIcon } from './icons';

interface HeadshotPreviewProps {
  src: string | null;
  isLoading: boolean;
  file: File | null;
}

export const HeadshotPreview: React.FC<HeadshotPreviewProps> = ({ src, isLoading, file }) => {
  const handleDownload = () => {
    if (!src || !file) return;

    const originalFilename = file.name;
    const nameWithoutExtension = originalFilename
      .split('.')
      .slice(0, -1)
      .join('.');
    const newFilename = `${nameWithoutExtension}_cropped.jpg`;
    
    const link = document.createElement('a');
    link.href = src;
    link.download = newFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="flex-grow flex flex-col justify-center items-center p-4 bg-slate-900/50 rounded-lg border border-slate-700">
      <div className="w-full max-w-[256px] aspect-square bg-slate-700 rounded-full overflow-hidden flex items-center justify-center mb-4 shadow-inner">
        {isLoading ? (
            <div className="flex flex-col items-center text-slate-400">
                <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm">Creating magic...</p>
            </div>
        ) : src ? (
          <img src={src} alt="Cropped headshot" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-slate-500">
            <UserCircleIcon />
            <p className="mt-2 text-sm">Your headshot will appear here</p>
          </div>
        )}
      </div>
      {src && !isLoading && (
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-900 transition-colors"
        >
          <DownloadIcon />
          Download Again
        </button>
      )}
    </div>
  );
};
