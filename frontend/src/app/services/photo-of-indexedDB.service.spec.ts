import { TestBed } from '@angular/core/testing';

import { PhotoIndexedDbService } from './photo-of-indexedDB.service';

describe('PhotoIndexedDbService', () => {
  let service: PhotoIndexedDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PhotoIndexedDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
