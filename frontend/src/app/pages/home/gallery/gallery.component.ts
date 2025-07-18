import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Photo } from '../../../models/photo-interfaces';
import { SafeUrl } from '@angular/platform-browser';


type PhotoWithUrl = Photo & { url: SafeUrl };

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, NgFor],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent {
  @Input() photos: PhotoWithUrl[] = [];
  @Output() photoSelected = new EventEmitter<PhotoWithUrl>();

  selectedPhotoId?: number;
  selectedPhotoIds = new Set<number>();


  selectPhoto(photo: PhotoWithUrl) {
    this.selectedPhotoId = photo.id;
    this.photoSelected.emit(photo);
  }


  private selectRange(toId: number) {
    if (this.selectedPhotoIds.size === 0) {
      this.selectedPhotoIds.add(toId);
      return;
    }
    // Атрымаць індэкс апошняга выбранага
    const photos = this.photos;
    const lastSelectedId = Array.from(this.selectedPhotoIds).slice(-1)[0];
    const startIndex = photos.findIndex(p => p.id === lastSelectedId);
    const endIndex = photos.findIndex(p => p.id === toId);

    if (startIndex < 0 || endIndex < 0) {
      this.selectedPhotoIds.add(toId);
      return;
    }

    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    this.selectedPhotoIds.clear();
    for (let i = from; i <= to; i++) {
      this.selectedPhotoIds.add(photos[i].id);
    }
  }

  isSelected(photo: PhotoWithUrl): boolean {
    return this.selectedPhotoId === photo.id;
  }

}
