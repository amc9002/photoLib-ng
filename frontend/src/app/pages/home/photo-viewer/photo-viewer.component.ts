import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectedPhotoComponent } from './selected-photo/selected-photo.component';
import { Photo } from '../../../models/photo';

@Component({
  selector: 'app-photo-viewer',
  standalone: true,
  imports: [
    CommonModule,
    SelectedPhotoComponent,
  ],
  templateUrl: './photo-viewer.component.html',
  styleUrls: ['./photo-viewer.component.scss']
})
export class PhotoViewerComponent {
  @Input() photo: Photo | null = null;
}
