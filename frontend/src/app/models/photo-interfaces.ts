// photo-interfaces.ts
import { SafeUrl } from "@angular/platform-browser";


interface PhotoBase {
  fileName: string;
  title?: string;
  description?: string;
  exif?: any;
  isSynced?: boolean;
  isModified?: boolean;
  isDeleted?: boolean;
}

// 🔸 Фота, якое ўжо гатовае для UI (мае url, id, fileName і г.д.)
export interface Photo extends PhotoBase {
  id: number | string;
  file?: File;
  url: string | SafeUrl;
  source?: 'mock' | 'user' | 'server';
  isSynced: boolean;
  isModified: boolean;
  isDeleted: boolean;
}


// 🔸 Для IndexedDB: палягчанае фота, якое яшчэ не загружана/няма URL
export interface PhotoToStore extends PhotoBase {
  id?: number | string;
  file?: File;
  url?: string | SafeUrl;
  type?: string;
  date?: string;
}

// 🔸 Для абнаўлення: толькі частка палёў абавязковая
export interface PhotoToUpdate extends Partial<Omit<Photo, 'id'>> {
  id: number | string;
}

// 🔸 Калі трэба гарантавана мець url (UI)
export type PhotoWithUrl = Required<Pick<Photo, 'url'>> & Photo;
