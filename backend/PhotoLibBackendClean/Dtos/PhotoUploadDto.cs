namespace PhotoLibBackendClean.Dtos;

public class PhotoUploadDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    // public IFormFile? ImageFile { get; set; }
    public string? ExifData { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }


    public string ImageUrl { get; set; }
}