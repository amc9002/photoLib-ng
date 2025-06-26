import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { Photo } from '../models/photo';

@Injectable({
  providedIn: 'root'
})
export class PhotoApiService {
  private apiUrl = 'http://localhost:5171/api/photos';

  constructor(private http: HttpClient) { }

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(this.apiUrl);
  }

  uploadPhoto(formData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, formData);
  }

  updatePhotoDescription(id: number, description: string) {
    const body = { description };
    return this.http.put<any>(`${this.apiUrl}/${id}`, body);
  }

  async downloadPhotoFile(id: number | string): Promise<File> {
    const url = `${this.apiUrl}/${id}/file`;
    const blob = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));

    if (!blob) {
      throw new Error('Failed to download photo file: blob is undefined');
    }

    return new File([blob], `photo_${id}.jpg`, { type: blob.type });
  }

  async deletePhoto(id: number | string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${id}`));
  }
}
