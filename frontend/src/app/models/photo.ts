import { SafeUrl } from "@angular/platform-browser";

export interface Photo {
  id: number | string;
  fileName: string;
  url: string | SafeUrl;
  title?: string,
  description?: string;
  exifData?: any;
  file?: File;
  source?: 'backend' | 'mock';
  isSynced: boolean;
  isModified: boolean;
  isDeleted: boolean
}