import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gallery } from '../../models/gallery-interfaces';
import { environment } from '../../../environments/envionment';


interface IGalleryApiService {
  pingServer(): Observable<void>;
  getGalleries(): Observable<Gallery[]>;
  createGallery(gallery: Omit<Gallery, 'id'>): Observable<Gallery>;
  updateGallery(id: number, gallery: Omit<Gallery, 'id'>): Observable<void>;
  deleteGallery(id: number): Observable<void>;
}

@Injectable({
  providedIn: 'root'
})
export class GalleryApiService implements IGalleryApiService {
  private readonly baseApiUrl = environment.apiUrl;            
  private readonly galleriesUrl = `${this.baseApiUrl}/galleries`;

  constructor(private http: HttpClient) { }

  pingServer(): Observable<any> {
    return this.http.get<void>(`${this.baseApiUrl}/health`, { observe: 'response' });
  }

  getGalleries(): Observable<Gallery[]> {
    return this.http.get<Gallery[]>(this.galleriesUrl);
  }

  createGallery(gallery: Omit<Gallery, 'id'>): Observable<Gallery> {
    return this.http.post<Gallery>(this.galleriesUrl, gallery);
  }

  updateGallery(id: number, gallery: Omit<Gallery, 'id'>): Observable<void> {
    return this.http.put<void>(`${this.galleriesUrl}/${id}`, gallery);
  }

  deleteGallery(id: number): Observable<void> {
    return this.http.delete<void>(`${this.galleriesUrl}/${id}`);
  }
}
