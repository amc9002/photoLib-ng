using Microsoft.EntityFrameworkCore;
using PhotoLibBackendClean.Models;

namespace PhotoLibBackendClean.Infrastructure.Seed;

public class DemoDataSeederService
{
    private readonly PhotoContext _context;

    public DemoDataSeederService(PhotoContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        var defaultGallery = await _context.Galleries
            .FirstOrDefaultAsync(g => g.Name == "Default Gallery");

        if (defaultGallery == null)
            return;

        if (!_context.Photos.Any())
        {
            _context.Photos.AddRange(
                new Photo
                {
                    Title = "Тэставае фота",
                    Description = "Гэта тэставае апісанне",
                    ExifData = "EXIF: ISO 100, f/2.8",
                    Url = "https://example.com/photo1.jpg",
                    GalleryId = defaultGallery.Id
                },
                new Photo
                {
                    Title = "Другое фота",
                    Description = "Апісанне другога фота",
                    ExifData = "EXIF: ISO 200, f/5.6",
                    Url = "https://example.com/photo2.jpg",
                    GalleryId = defaultGallery.Id
                }
            );

            await _context.SaveChangesAsync();
        }
    }
}
