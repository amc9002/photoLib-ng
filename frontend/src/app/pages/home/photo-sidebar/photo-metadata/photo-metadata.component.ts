import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as exifr from 'exifr';

@Component({
  selector: 'app-photo-metadata',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-metadata.component.html',
  styleUrls: ['./photo-metadata.component.scss']
})
export class PhotoMetadataComponent implements OnChanges {
  @Input() photo: any = null;
  @Output() exifExtracted = new EventEmitter<any>();

  exif: any = null;
  modalOpen = false;

  async ngOnChanges(changes: SimpleChanges) {
    if (!this.photo || !this.photo.url) {
      this.exif = null;
      this.exifExtracted.emit(null);
      return;
    }

    if (changes['photo'] && this.photo?.url) {
      try {
        const rawUrl = this.photo.url instanceof Object && 'changingThisBreaksApplicationSecurity' in this.photo.url
          ? (this.photo.url as any).changingThisBreaksApplicationSecurity
          : this.photo.url;

        console.log("🔍 Trying to fetch from rawUrl:", rawUrl);
        const response = await fetch(rawUrl);
        const blob = await response.blob();

        const exifData = await exifr.parse(blob);

        if (exifData) {
          this.exif = {
            camera: exifData.Model || 'Unknown',
            date: exifData.DateTimeOriginal?.toString() || 'Unknown',
            size: `${Math.round(blob.size / 1024)} KB`,
            ISO: exifData.ISO || 0,
            Aperture: exifData.FNumber ? `f/${exifData.FNumber}` : 'Unknown',
            GPSLatitude: exifData.latitude,
            GPSLongitude: exifData.longitude,
            ...exifData
          };

          this.exifExtracted.emit(this.exif);
        } else {
          this.exif = null;
          console.warn('EXIF not found');
          this.exifExtracted.emit(this.exif);
        }
      } catch (err) {
        console.error('EXIF reading error:', err);
        this.exif = null;
        this.exifExtracted.emit(this.exif);
      }
    }
  }

  get exifKeys(): string[] {
    return this.exif ? Object.keys(this.exif) : [];
  }

  toggleModal() {
    this.modalOpen = !this.modalOpen;
  }

}