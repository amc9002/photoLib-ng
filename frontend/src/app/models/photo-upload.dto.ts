export interface PhotoForServerUpload {
  file: File;
  title: string;
  description: string;
  exifData: any;
  galleryId: number;
}