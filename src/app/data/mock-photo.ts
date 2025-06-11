import { Photo } from "../models/photo";

export const photos: Photo[] = [
    {
      id: 1,
      url: 'assets/images/1000_F_199824276_somlbrYKh1XlUnyvLbn3xwjZLlXvEkHx.jpg',
      description: 'Сукенка',
      exif: {
        camera: 'Canon EOS 600D',
        date: '2024-05-12',
        size: '5 MB',
        ISO: 200,
        Aperture: 'f/2.8'
      }
    },
    {
      id: 2,
      url: 'assets/images/IMG_20221209_135905.jpg',
      description: 'Віта'
    },
    {
      id: 3,
      url: 'assets/images/photo_2024-04-25_11-32-00.jpg',
      description: 'Наш двор'
    },
    {
      id: 4,
      url: 'assets/images/IMG_20250601_120944.jpg',
      description: 'Мачанка'
    },
    {
      id: 5,
      url: 'assets/images/IMG_20250608_164930.jpg',
      description: 'Ольштын'
    },
    {
      id: 6,
      url: 'https://www.kliniki.pl/photos/286/dental-clinic-lux-med-stomatologia-olsztyn_285841_h1000.jpg',
      description: 'Клініка'
    }
  ];