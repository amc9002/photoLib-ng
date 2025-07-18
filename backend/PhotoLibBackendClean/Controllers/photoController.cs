using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoLibBackendClean.Models;
using PhotoLibBackendClean.Dtos;

namespace PhotoLibBackendClean.Controllers
{
    [ApiController]
    [Route("api/photos")]
    public class ApiController : ControllerBase
    {
        private readonly PhotoContext _context;
        public ApiController(PhotoContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PhotoThumbnailDto>>> GetPhotos()
        {
            var thumbnails = await _context.Photos
            .Where(t => t.ImageData != null)
            .Select(t => new PhotoThumbnailDto
            {
                Id = t.Id,
                ThumbnailBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(t.ImageData!)}"
            }).ToListAsync();

            return Ok(thumbnails);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PhotoMetadataDto>> GetPhoto(int id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null)
                return NotFound();

            var metadata = new PhotoMetadataDto
            {
                Id = photo.Id,
                Title = photo.Title,
                Description = photo.Description,
                ExifData = photo.ExifData,
            };
            return Ok(metadata);
        }

        [HttpGet("{id}/image")]
        public async Task<ActionResult<Photo>> GetPhotoImage(int id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null || photo.ImageData == null)
                return NotFound();

            return File(photo.ImageData, "image/jpeg");
        }

        [HttpGet("bygallery/{galleryId}")]
        public async Task<ActionResult<IEnumerable<PhotoThumbnailDto>>> GetPhotosByGallery(int galleryId)
        {
            var thumbnails = await _context.Photos
                .Where(p => p.GalleryId == galleryId && p.ImageData != null)
                .Select(p => new PhotoThumbnailDto
                {
                    Id = p.Id,
                    ThumbnailBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(p.ImageData!)}",
                    GalleryId = p.GalleryId
                })
                .ToListAsync();

            return Ok(thumbnails);
        }

        [HttpPost]
        public async Task<ActionResult<PhotoFullDto>> PostPhoto([FromForm] PhotoUploadDto dto)
        {
            Console.WriteLine($"PostPhoto called with GalleryId = {dto.GalleryId}");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var galleryExists = await _context.Galleries.AnyAsync(g => g.Id == dto.GalleryId);
            if (!galleryExists)
                return BadRequest($"Gallery with Id={dto.GalleryId} does not exist.");

            byte[] imageData;
            using (var memoryStream = new MemoryStream())
            {
                if (dto.ImageFile == null || dto.ImageFile.Length == 0)
                    return BadRequest("No image file provided.");

                await dto.ImageFile.CopyToAsync(memoryStream);
                imageData = memoryStream.ToArray();
            }

            var photo = new Photo
            {
                Title = string.IsNullOrWhiteSpace(dto.Title) ? "[Без назвы]" : dto.Title,
                Description = dto.Description,
                ExifData = dto.ExifData,
                ImageData = imageData,
                GalleryId = dto.GalleryId
            };

            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();

            var uploadedPhoto = new PhotoFullDto
            {
                Id = photo.Id,
                Title = photo.Title,
                Description = photo.Description,
                ExifData = photo.ExifData,
                ImageBase64 = Convert.ToBase64String(photo.ImageData)
            };

            return CreatedAtAction(nameof(GetPhoto), new { id = uploadedPhoto.Id }, uploadedPhoto);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePhotoMetadata(int id, [FromForm] string Title, [FromForm] string Description, [FromForm] string ExifData)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null)
                return NotFound();

            photo.Title = Title;
            photo.Description = Description;
            photo.ExifData = ExifData;

            await _context.SaveChangesAsync();
            return NoContent();
        }


        [HttpPut("{id}/image")]
        public async Task<IActionResult> UpdatePhotoImage(int id, [FromForm] IFormFile imageFile)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null)
                return NotFound();

            if (imageFile == null)
                return BadRequest("No image file provided.");

            using var memoryStream = new MemoryStream();
            await imageFile.CopyToAsync(memoryStream);
            photo.ImageData = memoryStream.ToArray();

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Photo>> DeletePhoto(string id)
        {
            var photo = await _context.Photos.FirstOrDefaultAsync(p => p.Id.ToString() == id);
            if (photo == null)
                return NotFound();

            _context.Photos.Remove(photo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}