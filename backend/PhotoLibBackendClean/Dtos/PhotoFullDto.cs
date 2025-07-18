namespace PhotoLibBackendClean.Dtos;

public class PhotoFullDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ExifData { get; set; }
    public string? ImageBase64 { get; set; }
    public int GalleryId { get; set; }
}