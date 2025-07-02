import {
  Component,
  Input,
  OnChanges,
  ElementRef,
  ViewChild,
  SimpleChanges,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="hasCoordinates(); else noCoords" #mapContainer style="height: 300px;"></div>
    <ng-template #noCoords>
      <p><em>No geolocation.</em></p>
    </ng-template>
  `,
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnChanges, AfterViewInit {
  @Input() exif: any = null;
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  latitude?: number;
  longitude?: number;

  map: L.Map | null = null;
  marker: L.Marker | null = null;

  private mapInitialized = false;

  ngOnChanges(changes: SimpleChanges): void {
    this.latitude = this.convertDMSToDecimal(this.exif?.GPSLatitude, this.exif?.GPSLatitudeRef);
    this.longitude = this.convertDMSToDecimal(this.exif?.GPSLongitude, this.exif?.GPSLongitudeRef);

    if (!this.hasCoordinates()) {
      console.warn('EXIF does not contain valid GPS coordinates');

      if (this.map) {
        this.map.remove();
        this.map = null;
        this.marker = null;
      }

      return;
    }

    if (this.mapInitialized) {
      if (this.map) {
        this.updateMap();
      } else {
        // Чакаем, пакуль DOM цалкам гатовы (ViewChild)
        setTimeout(() => {
          this.initMap();
        }, 50);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.hasCoordinates()) {
        this.initMap();
      }
      this.mapInitialized = true;
    }, 50); // або 50 мс, калі трэба
  }

  public hasCoordinates(): boolean {
    return (
      this.latitude != null &&
      this.longitude != null &&
      !isNaN(this.latitude) &&
      !isNaN(this.longitude)
    );
  }

  private convertDMSToDecimal(dms: number[] | undefined, ref?: string): number | undefined {
    if (!Array.isArray(dms) || dms.length < 3) return undefined;
    const [degrees, minutes, seconds] = dms;
    let decimal = degrees + minutes / 60 + seconds / 3600;

    if (ref === 'S' || ref === 'W') {
      decimal = -decimal;
    }
    return isNaN(decimal) ? undefined : decimal;
  }

  private initMap(): void {
    console.log('Initializing map with coords:', this.latitude, this.longitude);

    const coords: [number, number] = [this.latitude!, this.longitude!];

    this.map = L.map(this.mapContainer.nativeElement).setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    const markerIcon = L.icon({
      iconUrl: 'assets/leaflet/marker-icon.png',
      shadowUrl: 'assets/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.marker = L.marker(coords, { icon: markerIcon })
      .addTo(this.map)
      .bindPopup('Photo location');
    this.marker.openPopup();

    setTimeout(() => {
      this.map!.invalidateSize();
    }, 0);
  }

  private updateMap(): void {
    if (this.map && this.marker && this.hasCoordinates()) {
      const coords: [number, number] = [this.latitude!, this.longitude!];
      this.marker.setLatLng(coords);
      this.map.setView(coords, this.map.getZoom());

      setTimeout(() => {
        this.map!.invalidateSize();
      }, 0);
    }
  }
}
