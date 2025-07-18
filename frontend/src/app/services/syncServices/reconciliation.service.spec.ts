import { TestBed } from '@angular/core/testing';
import { ReconciliationService } from './reconciliation.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Photo } from '../../models/photo-interfaces';
import { PhotoIndexedDbService } from '../indexedDbServices/photo-indexedDB.service';
import { GalleryIndexedDbService } from '../indexedDbServices/gallery-indexedDb.service';
import { GalleryApiService } from '../apiServices/gallery-api.service';
import { GallerySyncService } from './gallery-sync.service';
import { PhotoSyncService } from './photo-sync.service';
import { of } from 'rxjs';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  let photoDb: jasmine.SpyObj<PhotoIndexedDbService>;
  let galleryDb: jasmine.SpyObj<GalleryIndexedDbService>;
  let galleryApi: jasmine.SpyObj<GalleryApiService>;
  let gallerySync: jasmine.SpyObj<GallerySyncService>;
  let photoSync: jasmine.SpyObj<PhotoSyncService>;

  function setupPhotosForOrphanTest(serverPhotos: Photo[] = [
    { id: 1, fileName: 'a.jpg', url: 'url1', isSynced: true, isDeleted: false, isModified: false },
    { id: 2, fileName: 'b.jpg', url: 'url2', isSynced: true, isDeleted: false, isModified: false },
  ]) {
    const localPhotos: Photo[] = [
      { id: 1, fileName: 'a.jpg', url: 'url1', isSynced: true, isDeleted: false, isModified: false },
    ];

    galleryDb.getAllGalleries.and.resolveTo([]);
    galleryApi.getGalleries.and.returnValue(of([]));
    photoDb.getAllPhotos.and.resolveTo(localPhotos);
    photoSync.getServerPhotos.and.resolveTo(serverPhotos);

    return { serverPhotos, localPhotos };
  }



  beforeEach(() => {
    photoDb = jasmine.createSpyObj('PhotoIndexedDbService', ['getAllPhotos']);
    photoDb.savePhotoMetadataOnly = jasmine.createSpy().and.resolveTo();
    galleryDb = jasmine.createSpyObj('GalleryIndexedDbService', ['getAllGalleries']);
    galleryApi = jasmine.createSpyObj('GalleryApiService', ['getGalleries']);
    gallerySync = jasmine.createSpyObj('GallerySyncService', ['syncSingleGallery']);
    photoSync = jasmine.createSpyObj('PhotoSyncService', [
      'syncPhotosForGallery',
      'getServerPhotoIds',
      'getServerPhotos'
    ]);

    TestBed.configureTestingModule(
      {
        imports: [
          HttpClientTestingModule], // 🟢 вось тут галоўнае
        providers: [
          { provide: PhotoIndexedDbService, useValue: photoDb },
          { provide: GalleryIndexedDbService, useValue: galleryDb },
          { provide: GalleryApiService, useValue: galleryApi },
          { provide: GallerySyncService, useValue: gallerySync },
          { provide: PhotoSyncService, useValue: photoSync },
          ReconciliationService
        ]
      });

    service = TestBed.inject(ReconciliationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('getOrphanedServerPhotos() should return orphaned server photos not in IndexedDB', async () => {
    const { serverPhotos } = setupPhotosForOrphanTest();

    const orphaned = await service.getOrphanedServerPhotos();

    expect(orphaned.length).toBe(1);
    expect(orphaned[0].id).toBe(serverPhotos[1].id);
  });


  it('photoDb.savePhotoWithoutFile() should store orphaned server photos in IndexedDB during reconcile', async () => {
    const { serverPhotos } = setupPhotosForOrphanTest();

    photoDb.savePhotoMetadataOnly.and.resolveTo();

    await service.reconcile();

    expect(photoDb.savePhotoMetadataOnly).toHaveBeenCalledTimes(1);
    expect(photoDb.savePhotoMetadataOnly).toHaveBeenCalledWith(serverPhotos[1]);
  });

});
