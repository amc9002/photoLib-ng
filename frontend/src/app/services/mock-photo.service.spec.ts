import { TestBed } from '@angular/core/testing';

import { MockPhotoService } from './mock-photo.service';

describe('MockPhotoService', () => {
  let service: MockPhotoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockPhotoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
