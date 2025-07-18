using PhotoLibBackendClean.Models;

namespace PhotoLibBackendClean.Infrastructure.Seed;

public class DatabaseSeederService
{
    private readonly PhotoContext _context;

    public DatabaseSeederService(PhotoContext context)
    {
        _context = context;
    }

    public async Task SeedAsync()
    {
        if (!_context.Galleries.Any())
        {
            var gallery = new Gallery
            {
                Name = "Default Gallery",
                CreatedAt = null
            };

            _context.Galleries.Add(gallery);
            await _context.SaveChangesAsync();
        }
    }
}
