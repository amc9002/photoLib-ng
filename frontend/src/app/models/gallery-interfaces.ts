export interface GalleryBase {
  name: string;
  photoIds?: number[];
  creator?: string;
  createdAt?: string;      // ISO-фармат даты
  updatedAt?: string;
  isSynced: boolean;
  isHidden: boolean;
  // іншыя палі, акрамя id
}

export interface Gallery extends GalleryBase {
  id: number;
}