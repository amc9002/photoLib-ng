import { Component } from '@angular/core';
import { HomeComponent } from './pages/home/home.component';
import { PhotoService } from './services/photo.service';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogService } from './shared/confirm-dialog/confirm-dialog.service';
import { Photo } from './models/photo';
import { CommonModule } from '@angular/common';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { SpinnerComponent } from './shared/spinner/spinner.component';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ standalone кампанент
  imports: [ 
    HomeComponent,
    SpinnerComponent, 
    ConfirmDialogComponent, 
    CommonModule ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'photolib-ng';
  loading$: Observable<boolean>;
  photos$!: Observable<Photo[]>;

  photos: Photo[] = [];

  selectedPhoto: Photo | null = null;

  constructor(
    private loadingService: LoadingService,
    private confirmDialogService: ConfirmDialogService,
    private photoService: PhotoService
  ) {
    this.loading$ = this.loadingService.loading$;
    this.photoService.photos$.subscribe(p => {
      this.photos = p ?? [];
    });
   }

  onPhotoSelected(photo: Photo) {
    this.selectedPhoto = photo;
  } 

  onEditDescription() {
    console.log("Edit description dialog called");
  }

  onUploadPhoto(file: File){
    this.photoService.addPhoto(file);
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
