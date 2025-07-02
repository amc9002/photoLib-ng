import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPhotoDialogComponent } from './edit-photo-dialog.component';

describe('EditPhotoDialogComponent', () => {
  let component: EditPhotoDialogComponent;
  let fixture: ComponentFixture<EditPhotoDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPhotoDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditPhotoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
