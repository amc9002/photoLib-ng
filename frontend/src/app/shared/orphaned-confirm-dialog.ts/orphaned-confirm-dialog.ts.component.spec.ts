import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrphanedConfirmDialogComponent } from './orphaned-confirm-dialog.ts.component';



describe('OrphanedConfirmDialogTsComponent', () => {
  let component: OrphanedConfirmDialogComponent;
  let fixture: ComponentFixture<OrphanedConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrphanedConfirmDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrphanedConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
