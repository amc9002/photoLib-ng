using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoLibBackendClean.Models;
using PhotoLibBackendClean.Dtos;

namespace PhotoLibBackendClean.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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
            var photos = await _context.Photos.ToListAsync();
            var thumbnails = photos.Select(p => new PhotoThumbnailDbo
            {
                Id = p.Id,
                Title = p.Title?? "No title",
                ThumbnailBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(p.ImageData)}"
            });
            return Ok(thumbnails);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Photo>> GetPhoto(int id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null)
                return NotFound();

            return new PhotoUploadDto
            {
                dto.Title = photo.Title,
                dto.Description = photo.Description,
                dto.ExifData = photo.ExifData,
                dto.Latitude = photo.Latitude,
                dto.Longitude = photo.Longitude,
                ImageBase64 = $"data:image/jpeg;base64,{Convert.ToBase64String(photo.ImageData)}"
            };
        }

        [HttpGet("{id}/image")]
        public async Task<ActionResult<Photo>> GetPhotoImage(int id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null || photo.imageData == null)
                return NotFound();

            return File(photo.ImageData, "image/jpeg");
        }

        [HttpPost]
        public async Task<ActionResult<Photo>> PostPhoto([FromForm] PhotoUploadDto dto)
        {
            byte[] imageData;
            using (var memoryStream = new MemoryStream())
            {
                if (dto.ImageFile == null)
                    return BadRequest("No image file provided.");

                await dto.ImageFile.CopyToAsync(memoryStream);
                imageData = memoryStream.ToArray();
            }

            var photo = new Photo
            {
                Title = dto.Title,
                Description = dto.Description,
                ImageData = imageData,
                ExifData = dto.ExifData,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude
            };

            _context.Photos.Add(photo);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPhoto), new { id = photo.Id }, photo);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<Photo>> DeletePhoto(int id)
        {
            var photo = await _context.Photos.FindAsync(id);
            if (photo == null)
                return NotFound();

            _context.Photos.Remove(photo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}