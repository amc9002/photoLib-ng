using Microsoft.EntityFrameworkCore;

namespace PhotoLibBackendClean.Models
{
    public class PhotoContext : DbContext
    {
        public PhotoContext(DbContextOptions<PhotoContext> options) : base(options) { }
        public DbSet<Photo> Photos { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Photo>().HasData(
                new Photo
                {
                    Id = 1,
                    Title = "Тэставае фота",
                    Description = "Гэта тэставае апісанне",
                    ExifData = "EXIF: ISO 100, f/2.8",
                    Url = "https://example.com/photo1.jpg",
                    ImageData = null
                },
                new Photo
                {
                    Id = 2,
                    Title = "Другое фота",
                    Description = "Апісанне другога фота",
                    ExifData = "EXIF: ISO 200, f/5.6",
                    Url = "https://example.com/photo2.jpg",
                    ImageData = null
                }
            );
        }
    }
}