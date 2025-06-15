import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Photo } from '../models/photo';

@Injectable({
  providedIn: 'root'
})
export class PhotoApiService {
  private apiUrl = 'https://localhost:7211/api/photos';

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
}
