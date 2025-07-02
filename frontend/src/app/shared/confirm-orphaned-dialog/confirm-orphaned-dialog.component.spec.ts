import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmOrphanedDialogComponent } from './confirm-orphaned-dialog.component';

describe('ConfirmOrphanedDialogComponent', () => {
  let component: ConfirmOrphanedDialogComponent;
  let fixture: ComponentFixture<ConfirmOrphanedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmOrphanedDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmOrphanedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
