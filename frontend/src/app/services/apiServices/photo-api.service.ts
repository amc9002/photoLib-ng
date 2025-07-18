import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Photo } from '../../models/photo-interfaces';
import { environment } from '../../../environments/envionment';


interface IPhotoApiService {
  getPhotos(): Observable<Photo[]>; 
  uploadPhoto(formData: FormData): Observable<any>; 
  updatePhoto(id: number, formData: FormData): Observable<any>; 
  downloadPhotoFile(id: number): Promise<File>; 
  deletePhoto(id: number): Promise<void>;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoApiService implements IPhotoApiService {
  private readonly baseApiUrl = environment.apiUrl;
  private readonly photosUrl = `${this.baseApiUrl}/photos`;

  constructor(private http: HttpClient) { }

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.photosUrl);
  }

  uploadPhoto(formData: FormData): Observable<any> {
    return this.http.post(this.photosUrl, formData);
  }

  updatePhoto(id: number, formData: FormData): Observable<any> {
    return this.http.put<any>(`${this.photosUrl}/${id}`, formData);
  }

  async downloadPhotoFile(id: number): Promise<File> {
    const url = `${this.photosUrl}/${id}/file`;
    const blob = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));

    if (!blob) {
      throw new Error('Failed to download photo file: blob is undefined');
    }

    return new File([blob], `photo_${id}.jpg`, { type: blob.type });
  }

  async deletePhoto(id: number): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.photosUrl}/${id}`));
  }
}
