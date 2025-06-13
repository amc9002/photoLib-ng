import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-photo-description',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './photo-description.component.html',
  styleUrls: ['./photo-description.component.scss']
})
export class PhotoDescriptionComponent {
  @Input() description: string | null = null;
  @Output() descriptionSaved = new EventEmitter<string>();
  @Output() editingCancelled = new EventEmitter<void>();
  @ViewChild('descRef') descRef!: ElementRef;
  
  private _editingFromOutside = false;

  @Input()
  set editingFromOutside(value: boolean) {
    if (value) {
      this.startEditing();
    }
    this._editingFromOutside = value;
  }

  get editingFromOutside() {
    return this._editingFromOutside;
  }
  isClamped: boolean = false;

  ngAfterViewInit() {
    setTimeout(() => this.checkIfClamped(), 0); // Каб DOM паспеў адмалявацца
  }

  checkIfClamped() {
    const el = this.descRef.nativeElement as HTMLElement;
    this.isClamped = el.scrollHeight > el.clientHeight + 2; // +2 для невялікага люфта
  }

  showFull = false;
  isEditing = false;
  editedDescription: string | null = null;

  toggleDescription() {
    this.showFull = !this.showFull;
  }

  startEditing() {
    this.editedDescription = this.description || '';
    this.isEditing = true;
  }

  save() {
    this.description = this.editedDescription?.trim() || '';
    this.isEditing = false;
    this.showFull = false;
    this.checkIfClamped(); // абнавіць стыль пасля змены
    this.descriptionSaved.emit(this.description ?? '');
  }

  cancel() {
    this.isEditing = false;
    this.editingCancelled.emit();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editingFromOutside'] && changes['editingFromOutside'].currentValue === true) {
      this.startEditing();
    }
  }
}



