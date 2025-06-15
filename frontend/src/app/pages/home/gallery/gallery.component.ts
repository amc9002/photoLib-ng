import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Photo } from '../../../models/photo';
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

  selectedPhotoUrl?: SafeUrl;

  selectPhoto(photo: PhotoWithUrl) {
    this.selectedPhotoUrl = photo.url;
    this.photoSelected.emit(photo);
  }
}
