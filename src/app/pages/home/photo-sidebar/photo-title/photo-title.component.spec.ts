import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoTitleComponent } from './photo-title.component';

describe('PhotoTitleComponent', () => {
  let component: PhotoTitleComponent;
  let fixture: ComponentFixture<PhotoTitleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoTitleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
