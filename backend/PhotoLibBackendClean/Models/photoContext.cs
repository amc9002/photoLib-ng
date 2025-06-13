using Microsoft.EntityFrameworkCore;

namespace PhotoLibBackendClean.Models
{
    public class PhotoContext : DbContext
    {
        public PhotoContext(DbContextOptions<PhotoContext> options) : base(options) { }
        public DbSet<Photo> Photos { get; set; }
    }
}