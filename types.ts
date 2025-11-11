
export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageJob {
  id: string;
  file: File;
  originalSrc: string;
  croppedSrc: string | null;
  cropData: CropData | null;
  isLoading: boolean;
  error: string | null;
  hasBeenDownloaded: boolean;
}
