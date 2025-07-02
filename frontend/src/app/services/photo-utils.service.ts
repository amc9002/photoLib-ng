import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Photo } from '../models/photo-interfaces';

@Injectable({ providedIn: 'root' })
export class PhotoUtilsService {
  constructor(private sanitizer: DomSanitizer) { }

  fileToSafeUrl(file: File): SafeUrl {
    const objectUrl = URL.createObjectURL(file);
    return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
  }


  addUrlToPhotos(
    photos: Photo[],
    previousPhotos: (Photo & { url: SafeUrl })[]
  ): (Photo & { url: SafeUrl })[] {
    // Вызваляем старыя URL
    previousPhotos.forEach(p => {
      try {
        URL.revokeObjectURL((p.url as any).changingThisBreaksApplicationSecurity || p.url);
      } catch { }
    });

    // Дадаём новыя
    return photos.map(photo => {
      let url: SafeUrl;

      if (photo.file) {
        url = this.fileToSafeUrl(photo.file);
      } else if ((photo as any).blob) {
        url = this.fileToSafeUrl((photo as any).blob);
      } else if (photo.url) {
        url = photo.url;
      } else {
        url = this.fileToSafeUrl(new File([], 'empty.jpg'));
      }

      return {
        ...photo,
        url
      };
    });
  }

}

