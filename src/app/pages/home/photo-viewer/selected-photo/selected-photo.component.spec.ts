import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectedPhotoComponent } from './selected-photo.component';

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
    const testPhoto = { url: 'test.jpg', description: 'Test photo' };
    component.photo = testPhoto;
    expect(component.photo).toEqual(testPhoto);
  });
});