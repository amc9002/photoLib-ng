using System.ComponentModel.DataAnnotations;

namespace PhotoLibBackendClean.Models
{
    public class Photo
    {
        public int Id { get; set; }
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = String.Empty;
        public byte[]? ImageData { get; set; } = default!;
        [MaxLength(300)]
        public string? Description { get; set; } = string.Empty;
        public string? ExifData { get; set; }
        [MaxLength(500)]
        public string? Url { get; set; }
        [Required]
        public required int GalleryId { get; set; }
        public Gallery? Gallery { get; set; }
    }
}