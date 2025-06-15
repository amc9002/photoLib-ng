import { SafeUrl } from "@angular/platform-browser";

export interface Photo {
  id: number;
  url: string | SafeUrl;
  description: string;
  exif?: {
    camera: string;
    date: string;
    size: string;
    ISO: number;
    Aperture?: string;
    GPSLatitude?: number;
    GPSLongitude?: number;
    latitude?: number;
    longitude?: number;
    [key: string]: any; // для дадатковых палёў
  };
  source?: 'backend' | 'mock';
}