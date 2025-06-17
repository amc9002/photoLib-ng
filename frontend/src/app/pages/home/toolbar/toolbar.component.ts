import { Component, EventEmitter, Output } from '@angular/core';
import { AppModeService } from '../../../services/app-mode.service';
import { AppMode } from '../../../shared/app-mode.enum';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
  ],
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent {
  AppMode = AppMode; // каб выкарыстоўваць у шаблоне
  selectedMode: AppMode;

  @Output() syncRequested = new EventEmitter<void>();

  constructor(private appModeService: AppModeService) {
    this.selectedMode = this.appModeService.getMode();
  }

  onModeChange(mode: AppMode) {
    this.selectedMode = mode;
    this.appModeService.setMode(mode);
    console.log("🔧 Toolbar: AppMode switched to:", mode);
  }

  onSyncClick() {
    console.log("🔄 Toolbar: Карыстальнік націснуў кнопку сінхранізацыі");
    this.syncRequested.emit();
  }
}