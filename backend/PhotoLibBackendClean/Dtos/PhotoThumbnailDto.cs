namespace PhotoLibBackendClean.Dtos;

public class PhotoThumbnailDto
{
    public int Id { get; set; }
    public string? ThumbnailBase64 { get; set; }
    public int GalleryId { get; set; }
}