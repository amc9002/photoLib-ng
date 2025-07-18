namespace PhotoLibBackendClean.Dtos;
public class GalleryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsHidden { get; set; }
}