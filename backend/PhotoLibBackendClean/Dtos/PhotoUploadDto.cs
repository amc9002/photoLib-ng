using System.ComponentModel.DataAnnotations;

namespace PhotoLibBackendClean.Dtos;

public class PhotoUploadDto
{
    [Required(ErrorMessage = "Title is required")]
    [MinLength(1, ErrorMessage = "Title cannot be empty")]
    public string Title { get; set; } = String.Empty;
    public string? Description { get; set; }
    public IFormFile? ImageFile { get; set; }
    public string? ExifData { get; set; }

}