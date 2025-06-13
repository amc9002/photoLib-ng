namespace PhotoLibBackendClean.Dtos;

public class PhotoDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ExifData { get; set; }
    public IFormFile? ImageFile { get; set; } // optional
}