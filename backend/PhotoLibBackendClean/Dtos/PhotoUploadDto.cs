namespace PhotoLibBackendClean.Dtos;

public class PhotoUploadDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public IFormFile? ImageFile { get; set; }
    public string? ExifData { get; set; }

}