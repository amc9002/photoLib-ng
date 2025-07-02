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

  selectedPhotoId?: number | string;

  selectPhoto(photo: PhotoWithUrl) {
    this.selectedPhotoId = photo.id;
    this.photoSelected.emit(photo);
  }
}
