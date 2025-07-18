using System.ComponentModel.DataAnnotations;

namespace PhotoLibBackendClean.Models;

public class Gallery
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsHidden { get; set; } = false;

    [MaxLength(100)]
    public string? PasswordHash { get; set; }

    public DateTime? CreatedAt { get; set; }

    public List<Photo> Photos { get; set; } = [];
}
