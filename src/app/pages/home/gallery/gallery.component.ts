import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Photo } from '../../../models/photo';
import { PhotoService } from '../../../services/photo.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-gallery',
  imports: [CommonModule, NgFor],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent{
  @Output() photoSelected = new EventEmitter<Photo>();

  photos$!: Observable<Photo[]>;

  constructor(private photoService: PhotoService) {
    this.photos$ = this.photoService.photos$;
  }

  selectedPhotoUrl?: string;

  selectPhoto(photo: Photo) {
    this.selectedPhotoUrl = photo.url;
    this.photoSelected.emit(photo);
  }
}
