export interface Photo {
  id: number;
  url: string;
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
}