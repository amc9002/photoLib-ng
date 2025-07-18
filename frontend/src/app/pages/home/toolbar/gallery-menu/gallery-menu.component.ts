import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GalleryManagerService } from '../../../../services/galleryServices/gallery-manager.service';
import { Gallery, GalleryBase } from '../../../../models/gallery-interfaces';
import { GalleryStateService } from '../../../../services/stateServices/gallery-state.service';

@Component({
  selector: 'app-gallery-menu',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './gallery-menu.component.html',
  styleUrls: ['./gallery-menu.component.scss']
})
export class GalleryMenuComponent implements OnInit {
  @Output() gallerySelected = new EventEmitter<Gallery>();

  galleries: Gallery[] = [];
  selectedGalleryId: number | null = null;

  constructor(
    private galleryService: GalleryManagerService,
    private galleryState: GalleryStateService
  ) { }

  ngOnInit(): void {
    this.galleryService.loadGalleriesFromServer();

    this.galleryService.galleries$.subscribe(g => {
      console.log('GalleryMenuComponent.ngOnInit: Атрымаў галерэі:', g);
      this.galleries = g;
    });

    this.galleryState.selectedGallery$.subscribe(gallery => {
      this.selectedGalleryId = gallery ? gallery.id : null;
      console.log('GalleryMenuComponent.ngOnInit: Атрымаў selectedGallery:', gallery);
    });
  }


  onGalleryChange() {
    console.log('GalleryMenuComponent: 📂 Gallery selected:', this.selectedGalleryId);
    if (this.selectedGalleryId !== null) {
      this.galleryService.setSelectedGalleryId(this.selectedGalleryId);
      const gallery = this.galleries.find(g => g.id === this.selectedGalleryId);
      console.log('GalleryMenuComponent: gallery:', gallery);
      if (gallery) {
        console.log('GalleryMenuComponent: 📤 Emitting gallery to ToolbarComponent:', gallery.name);
        this.gallerySelected.emit(gallery); // паведамляем Toolbar
      }
    }
  }

  addGallery() {
    const name = prompt('Увядзіце назву новай галерэі:');
    if (name && name.trim()) {
      const trimmed = name.trim();
      if (this.galleries.some(g => g.name === trimmed)) {
        alert('Галерэя з такой назвай ужо існуе.');
        return;
      }
      const newGallery: GalleryBase = {
        name: trimmed,
        isSynced: false,
        isHidden: false
        // іншыя неабходныя палі, калі ёсць
      };
      this.galleryService.addGallery(newGallery);
    }
  }


  renameGallery() {
    console.log('✏️ Rename clicked');
  }

  generateGalleryName() {
    console.log('🔁 Generate name');
  }

  toggleVisibility() {
    console.log('👁️ Toggle visibility');
  }

  protectWithPassword() {
    console.log('🔒 Password protection');
  }
}
