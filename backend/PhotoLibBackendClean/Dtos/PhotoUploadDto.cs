using System.ComponentModel.DataAnnotations;

namespace PhotoLibBackendClean.Dtos;

public class PhotoUploadDto
{
    [Required(ErrorMessage = "Title is required")]
    [MinLength(1, ErrorMessage = "Title cannot be empty")]
    [StringLength(100, ErrorMessage = "Title length can't be more than 100.")]
    public string Title { get; set; } = String.Empty;
    public string? Description { get; set; }
    [Required(ErrorMessage = "ImageFile is required")]
    public IFormFile? ImageFile { get; set; }
    public string? ExifData { get; set; }
    [Required(ErrorMessage = "GalleryId is required")]
    public required int GalleryId { get; set; }

}