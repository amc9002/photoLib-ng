import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectedPhotoComponent } from './selected-photo.component';
import { Photo } from '../../../../models/photo-interfaces';

describe('SelectedPhotoComponent', () => {
  let component: SelectedPhotoComponent;
  let fixture: ComponentFixture<SelectedPhotoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectedPhotoComponent]  // standalone кампанент трэба імпартаваць у тэсты
    }).compileComponents();

    fixture = TestBed.createComponent(SelectedPhotoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open and close modal', () => {
    component.openFullSizeModal();
    expect(component.fullSizeOpen).toBeTrue();

    component.closeFullSizeModal();
    expect(component.fullSizeOpen).toBeFalse();
  });

  it('should accept photo input', () => {
    const testPhoto: Photo = {
  id: 1,
  url: 'some-url',
  description: 'Test description',
  isSynced: true,
  isModified: false,
  isDeleted: false,
  fileName: 'test.jpg',
  file: new File([''], 'test.jpg'), // калі патрэбна
  galleryId: 1001
};
;
    component.photo = testPhoto;
    expect(component.photo).toEqual(testPhoto);
  });
});