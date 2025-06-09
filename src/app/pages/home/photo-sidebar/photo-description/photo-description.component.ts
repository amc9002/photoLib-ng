import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-photo-description',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './photo-description.component.html',
  styleUrls: ['./photo-description.component.scss']
})
export class PhotoDescriptionComponent {
  @Input() description: string | null = null;

  showFull = false;

  toggleDescription() {
    this.showFull = !this.showFull;
  }
}

