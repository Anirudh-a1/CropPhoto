
import React, { useState, useCallback, useEffect } from 'react';
import { getCropCoordinates } from './services/geminiService';
import type { CropData, ImageJob } from './types';
import { ImageUploader } from './components/ImageUploader';
import { DownloadIcon, MagicWandIcon, ResetIcon, UploadIcon } from './components/icons';

const App: React.FC = () => {
  const [jobs, setJobs] = useState<ImageJob[]>([]);

  const resetState = useCallback(() => {
    // Revoke object URLs to prevent memory leaks
    jobs.forEach(job => URL.revokeObjectURL(job.originalSrc));
    setJobs([]);
  }, [jobs]);

  const handleDownload = useCallback((job: ImageJob) => {
    if (!job.croppedSrc) return;

    const originalFilename = job.file.name;
    const nameWithoutExtension = originalFilename
      .split('.')
      .slice(0, -1)
      .join('.');
    const newFilename = `${nameWithoutExtension}_cropped.jpg`;

    const link = document.createElement('a');
    link.href = job.croppedSrc;
    link.download = newFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  useEffect(() => {
    const jobToDownload = jobs.find(j => j.croppedSrc && !j.hasBeenDownloaded);

    if (jobToDownload) {
        const timer = setTimeout(() => {
            handleDownload(jobToDownload);
            setJobs(currentJobs =>
                currentJobs.map(j =>
                    j.id === jobToDownload.id ? { ...j, hasBeenDownloaded: true } : j
                )
            );
        }, 500); // 500ms delay between each auto-download

        return () => clearTimeout(timer);
    }
  }, [jobs, handleDownload]);

  const handleDownloadAll = () => {
    jobs.forEach((job, index) => {
      if (job.croppedSrc) {
        setTimeout(() => handleDownload(job), index * 200);
      }
    });
  };
  
  const applyCrop = async (imageSrc: string, cropData: CropData): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error("Canvas context not available"));

            // Get absolute pixel values for the crop area
            const sx_abs = cropData.x * img.naturalWidth;
            const sy_abs = cropData.y * img.naturalHeight;
            const sWidth_abs = cropData.width * img.naturalWidth;
            const sHeight_abs = cropData.height * img.naturalHeight;
            
            // The canvas will be a square using the largest dimension of the crop.
            // This ensures the main subject is not scaled down.
            const sideLength = Math.max(sWidth_abs, sHeight_abs);
            canvas.width = sideLength;
            canvas.height = sideLength;

            // --- 1. Draw Blurred Background ---
            // Scale the original image to cover the entire canvas, maintaining aspect ratio.
            ctx.save();
            const scale = Math.max(sideLength / img.naturalWidth, sideLength / img.naturalHeight);
            const bgWidth = img.naturalWidth * scale;
            const bgHeight = img.naturalHeight * scale;
            const bgX = (sideLength - bgWidth) / 2;
            const bgY = (sideLength - bgHeight) / 2;
            
            // Apply blur and a slight dimming effect
            ctx.filter = 'blur(8px) brightness(0.8)';
            ctx.drawImage(img, bgX, bgY, bgWidth, bgHeight);
            ctx.restore(); // Removes the filter for subsequent drawing operations

            // --- 2. Draw the Sharp Headshot on Top ---
            // Center the cropped (but potentially non-square) image onto the square canvas
            const dx = (sideLength - sWidth_abs) / 2;
            const dy = (sideLength - sHeight_abs) / 2;

            // Draw the cropped section from the original image onto our canvas
            ctx.drawImage(img, sx_abs, sy_abs, sWidth_abs, sHeight_abs, dx, dy, sWidth_abs, sHeight_abs);
            
            // Return the result as a high-quality JPEG
            resolve(canvas.toDataURL('image/jpeg', 0.95));
        };
        img.onerror = (err) => reject(err);
        img.src = imageSrc;
    });
  };

  const processJobs = useCallback(async (jobsToProcess: ImageJob[]) => {
    const promises = jobsToProcess.map(async (job) => {
        try {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = (e) => {
                    const result = e.target?.result as string;
                    if (result) {
                        resolve(result.split(',')[1]);
                    } else {
                        reject(new Error('Could not read file for base64 conversion.'));
                    }
                };
                reader.onerror = reject;
                reader.readAsDataURL(job.file);
            });

            const base64Image = await base64Promise;
            const newCropData = await getCropCoordinates(base64Image, job.file.type);
            const croppedImageSrc = await applyCrop(job.originalSrc, newCropData);

            return { ...job, id: job.id, cropData: newCropData, croppedSrc: croppedImageSrc, isLoading: false };
        } catch (err) {
            console.error(`Failed to process ${job.file.name}:`, err);
            return { ...job, id: job.id, error: 'Failed to generate crop.', isLoading: false };
        }
    });

    for (const promise of promises) {
        const settledJob = await promise;
        setJobs(currentJobs => {
            const index = currentJobs.findIndex(j => j.id === settledJob.id);
            if (index !== -1) {
                const updatedJobs = [...currentJobs];
                updatedJobs[index] = settledJob;
                return updatedJobs;
            }
            return currentJobs;
        });
    }
  }, []);
  
  const handleImageUpload = useCallback((selectedFiles: File[]) => {
    // Revoke object URLs of previous jobs to prevent memory leaks
    jobs.forEach(job => URL.revokeObjectURL(job.originalSrc));

    const newJobs: ImageJob[] = selectedFiles.map(file => ({
        id: `${file.name}-${Date.now()}`,
        file,
        originalSrc: URL.createObjectURL(file),
        croppedSrc: null,
        cropData: null,
        isLoading: true,
        error: null,
        hasBeenDownloaded: false,
    }));
    
    setJobs(newJobs); // Replace previous jobs with the new ones
    processJobs(newJobs);
  }, [jobs, processJobs]);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
            Magic Headshot Cropper
          </h1>
          <p className="mt-2 text-slate-400 text-lg">
            AI-powered batch processing for perfect, square headshots.
          </p>
        </header>

        <main className="flex flex-col gap-8">
            <div className="w-full bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-2 mb-4">
                    <UploadIcon />
                    Upload Your Image(s)
                </h2>
                <ImageUploader onImageUpload={handleImageUpload} />
            </div>

            {jobs.length > 0 && (
                <div className="w-full bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-2">
                            <MagicWandIcon />
                            Your Headshots
                        </h2>
                        <div className="flex gap-4">
                            <button
                                onClick={handleDownloadAll}
                                disabled={jobs.every(j => !j.croppedSrc || j.isLoading)}
                                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            >
                               <DownloadIcon /> Download All
                            </button>
                            <button
                                onClick={resetState}
                                className="inline-flex items-center justify-center p-2 border border-slate-600 text-base font-medium rounded-md shadow-sm text-slate-300 bg-slate-700 hover:bg-slate-600"
                                aria-label="Clear all"
                            >
                                <ResetIcon />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {jobs.map(job => (
                            <div key={job.id} className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden flex flex-col items-center justify-center text-center group shadow-md">
                                {job.isLoading && (
                                    <div className="flex flex-col items-center text-slate-400 p-2">
                                        <svg className="animate-spin h-8 w-8 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <p className="mt-2 text-xs text-slate-500 truncate">{job.file.name}</p>
                                    </div>
                                )}
                                {job.error && (
                                    <div className="p-2 text-red-400">
                                        <p className="text-sm font-semibold">Error</p>
                                        <p className="text-xs text-slate-500 truncate" title={job.file.name}>{job.file.name}</p>
                                    </div>
                                )}
                                {job.croppedSrc && (
                                    <>
                                        <img src={job.croppedSrc} alt={`Cropped ${job.file.name}`} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                                            <p className="text-xs text-white break-all mb-2" title={job.file.name}>{job.file.name}</p>
                                            <button onClick={() => handleDownload(job)} className="inline-flex items-center p-2 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700">
                                                <DownloadIcon />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default App;
