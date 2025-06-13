namespace PhotoLibBackendClean.Dtos;

public class PhotoMetadataDto
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? ExifData { get; set; }
}