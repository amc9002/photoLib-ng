import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhotoActionsComponent } from './photo-actions.component';

describe('PhotoActionsComponentComponent', () => {
  let component: PhotoActionsComponent;
  let fixture: ComponentFixture<PhotoActionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoActionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhotoActionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
