import { Component, EventEmitter, Output } from '@angular/core';

import { ConnectionService } from '../../../services/connection.service';
import { AppMode, AppModeService } from '../../../services/utilServices/app-mode.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GalleryMenuComponent } from './gallery-menu/gallery-menu.component';
import { Gallery } from '../../../models/gallery-interfaces';
import { GalleryManagerService } from '../../../services/galleryServices/gallery-manager.service';
import { GalleryStateService } from '../../../services/stateServices/gallery-state.service';
import { AppInitializerService } from '../../../services/init/app-initializer.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    FormsModule,
    GalleryMenuComponent,
    CommonModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  selectedMode: string;

  @Output() syncRequested = new EventEmitter<void>();
  @Output() gallerySelected = new EventEmitter<Gallery>();

  constructor(
    private connectionService: ConnectionService,
    private appInitializerService: AppInitializerService,
    private appModeService: AppModeService,
    private galleryService: GalleryManagerService,
    private galleryState: GalleryStateService,
  ) {
    const mode = this.appModeService.getMode();
    this.selectedMode = (mode === AppMode.Demo) ? 'demo' : 'work';
  }

  isOnline = true;
  isGalleryMenuOpen = false;

  ngOnInit(): void {
    this.connectionService.online$.subscribe(online => {
      this.isOnline = online;
    });
  }

  toggleGalleryMenu() {
    this.isGalleryMenuOpen = !this.isGalleryMenuOpen;
  }

  onGallerySelected(gallerySelected: Gallery) {
    console.log("ToolbarComponent: 🖼️ Gallery selected in Toolbar:", gallerySelected.name);
    this.galleryService.setSelectedGalleryId(gallerySelected.id);
    this.galleryState.setSelectedGallery(gallerySelected);

    console.log("📤 ToolbarComponent: emitting to HomeComponent...");
    this.gallerySelected.emit(gallerySelected);
  }

  async onModeChange(mode: string) {
    this.selectedMode = mode as AppMode;

    if (mode === 'work') {
      await this.appInitializerService.initializeApp();
    } else if (mode === 'demo') {
      this.appModeService.setMode(AppMode.Demo);
      console.log('🔧 Toolbar: пераход у Demo');
    }
  }

  onSyncClick() {
    console.log("🔄 Toolbar: Карыстальнік націснуў кнопку сінхранізацыі");
    this.syncRequested.emit();
  }
}