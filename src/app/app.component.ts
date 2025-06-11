import { Component } from '@angular/core';
import { HomeComponent } from './pages/home/home.component'; 
import { PhotoService } from './services/photo.service';
import { Photo } from './models/photo';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [HomeComponent], 
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'photolib-ng';

  selectedPhoto: Photo | null = null; 

  constructor(private photoService: PhotoService){}

  onDeletePhoto() {
    console.log("Deleting of photo", this.selectedPhoto);
    if(this.selectedPhoto) {
      this.photoService.deletePhoto(this.selectedPhoto);
      this.selectedPhoto = null;
    }
  }

  onPhotoSelected(photo: Photo){
    this.selectedPhoto = photo;
  }
}
