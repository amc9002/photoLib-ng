import { Injectable } from '@angular/core';
import * as exifr from 'exifr';

@Injectable({
    providedIn: 'root'
})
export class ExifExtractorService {
    async extractExifData(file: File): Promise<any> {
        try {
            const exif = await exifr.parse(file, { gps: true, exif: true });
            return exif ?? {};
        } catch {
            return {};
        }
    }
}
