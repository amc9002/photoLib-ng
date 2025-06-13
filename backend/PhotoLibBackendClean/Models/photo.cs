namespace PhotoLibBackendClean.Models
{
    public class Photo
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public byte[]? ImageData { get; set; } = default!;
        public string? Description { get; set; } = string.Empty;
        public string? ExifData { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}