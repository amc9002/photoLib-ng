import { Photo } from "../models/photo-interfaces";

export const photos: Photo[] = [
    {
      id: 1,
      title: 'Сукенка',
      fileName: 'images/1000_F_199824276_somlbrYKh1XlUnyvLbn3xwjZLlXvEkHx.jpg',
      url: 'assets/images/1000_F_199824276_somlbrYKh1XlUnyvLbn3xwjZLlXvEkHx.jpg',
      description: 'Сукенка',
      exif: {
        camera: 'Canon EOS 600D',
        date: '2024-05-12',
        size: '5 MB',
        ISO: 200,
        Aperture: 'f/2.8'
      },
      isSynced: false,
      isModified: false,
      isDeleted: false
    },
    {
      id: 2,
      title: 'Віта',
      fileName: 'IMG_20221209_135905.jpg',
      url: 'assets/images/IMG_20221209_135905.jpg',
      description: 'Віта',
      isSynced: false,
      isModified: false,
      isDeleted: false
    },
    {
      id: 3,
      title: 'Наш двор',
      fileName: 'photo_2024-04-25_11-32-00.jpg',
      url: 'assets/images/photo_2024-04-25_11-32-00.jpg',
      description: 'Наш двор',
      isSynced: false,
      isModified: false,
      isDeleted: false
    },
    {
      id: 4,
      title: 'Мачанка',
      fileName: 'IMG_20250601_120944.jpg',
      url: 'assets/images/IMG_20250601_120944.jpg',
      description: 'Мачанка',
      isSynced: false,
      isModified: false,
      isDeleted: false
    },
    {
      id: 5,
      title: 'Ольштын',
      fileName: 'IMG_20250608_164930.jpg',
      url: 'assets/images/IMG_20250608_164930.jpg',
      description: 'Ольштын',
      isSynced: false,
      isModified: false,
      isDeleted: false
    },
    {
      id: 6,
      title: 'Клініка',
      fileName: 'dental-clinic-lux-med-stomatologia-olsztyn_285841_h1000.jpg',
      url: 'https://www.kliniki.pl/photos/286/dental-clinic-lux-med-stomatologia-olsztyn_285841_h1000.jpg',
      description: 'Клініка',
      isSynced: false,
      isModified: false,
      isDeleted: false
    }
  ];