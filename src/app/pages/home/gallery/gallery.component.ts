import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { Photo } from '../../../models/photo';
import { PhotoService } from '../../../services/photo.service';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-gallery',
  imports: [CommonModule, NgFor],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent implements OnInit, OnDestroy{
  photos: Photo[] = [];
  private subscription!: Subscription;

  @Output() photoSelected = new EventEmitter<Photo>();

  photos$!: Observable<Photo[]>;

  constructor(private photoService: PhotoService) {
    this.photos$ = this.photoService.photos$;
  }

  ngOnInit() {
    this.subscription = this.photoService.photos$.subscribe(photos => {
      this.photos = photos;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  selectedPhotoUrl?: string;

  selectPhoto(photo: Photo) {
    this.selectedPhotoUrl = photo.url;
    this.photoSelected.emit(photo);
  }
}
