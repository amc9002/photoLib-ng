import { TestBed } from '@angular/core/testing';

import { PhotoDataService } from './photo-data.service';

describe('PhotoDataService', () => {
  let service: PhotoDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
