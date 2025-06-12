import { Component } from '@angular/core';
import { HomeComponent } from './pages/home/home.component';
import { PhotoService } from './services/photo.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from './shared/confirm-dialog/confirm-dialog.service';
import { Photo } from './models/photo';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [HomeComponent, ConfirmDialogComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'photolib-ng';

  selectedPhoto: Photo | null = null;

  constructor(
    private confirmDialogService: ConfirmDialogService,
    private photoService: PhotoService
  ) { }

  onPhotoSelected(photo: Photo) {
    this.selectedPhoto = photo;
  } 

  onEditDescription() {
    console.log("Edit description dialog called");
  }

  onUploadPhoto(){
    console.log("Uploading of photo");
  }

  onDeletePhoto() {
    console.log("Deleting of photo", this.selectedPhoto);
    if (!this.selectedPhoto) return;

    this.confirmDialogService.show(
      'Are you sure you want to delete this photo?',
      () => {
        this.photoService.deletePhoto(this.selectedPhoto!);
        this.selectedPhoto = null;
        console.log("Фота выдалена");
      }, 
      () =>{
        console.log("Выдаленьне адменена");
      } 
    );
  }
}
