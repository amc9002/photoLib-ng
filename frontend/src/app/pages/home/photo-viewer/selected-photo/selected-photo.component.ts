import { Component, Input } from '@angular/core';
import { Photo } from '../../../../models/photo-interfaces';

@Component({
  selector: 'app-selected-photo',
  templateUrl: './selected-photo.component.html',
  styleUrls: ['./selected-photo.component.scss'],
  standalone: true
})
export class SelectedPhotoComponent {
  @Input() photo: Photo | null = null;

  fullSizeOpen = false;

  openFullSizeModal() {
    this.fullSizeOpen = true;
  }

  closeFullSizeModal() {
    this.fullSizeOpen = false;
  }
}
