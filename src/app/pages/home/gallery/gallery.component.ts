import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../../models/photo';

@Component({
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss'
})
export class GalleryComponent {
  @Output() photoSelected = new EventEmitter<Photo>();

  photos: Photo[] = [
    {
      url: 'assets/images/1000_F_199824276_somlbrYKh1XlUnyvLbn3xwjZLlXvEkHx.jpg',
      description: 'Сукенка',
      exif: {
        camera: 'Canon EOS 600D',
        date: '2024-05-12',
        size: '5 MB',
        ISO: 200,
        Aperture: 'f/2.8'
      }
    },
    {
      url: 'assets/images/IMG_20221209_135905.jpg',
      description: 'Віта'
    },
    {
      url: 'assets/images/photo_2024-04-25_11-32-00.jpg',
      description: 'Наш двор'
    },
    {
      url: 'assets/images/IMG_20250601_120944.jpg',
      description: 'Мачанка'
    },
    {
      url: 'assets/images/IMG_20250608_164930.jpg',
      description: 'Ольштын'
    },
    {
      url: 'https://www.kliniki.pl/photos/286/dental-clinic-lux-med-stomatologia-olsztyn_285841_h1000.jpg',
      description: 'Клініка'
    }
  ];

  selectPhoto(photo: Photo) {
    this.photoSelected.emit(photo);
  }
}
