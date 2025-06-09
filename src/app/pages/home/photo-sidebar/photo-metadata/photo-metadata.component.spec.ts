import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoMetadataComponent } from './photo-metadata.component';

describe('AppExifComponent', () => {
  let component: PhotoMetadataComponent;
  let fixture: ComponentFixture<PhotoMetadataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoMetadataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoMetadataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
