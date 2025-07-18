using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PhotoLibBackendClean.Models;
using PhotoLibBackendClean.Dtos;

namespace PhotoLibBackendClean.Controllers
{
    [ApiController]
    [Route("api/galleries")]
    public class GalleryController : ControllerBase
    {
        private readonly PhotoContext _context;

        public GalleryController(PhotoContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<GalleryDto>>> GetGalleries()
        {
            var galleries = await _context.Galleries
                .Select(g => new GalleryDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    IsHidden = g.IsHidden
                })
                .ToListAsync();

            return Ok(galleries);
        }

        [HttpPost]
        public async Task<ActionResult<GalleryDto>> CreateGallery([FromBody] GalleryDto galleryDto)
        {
            var gallery = new Gallery
            {
                Name = galleryDto.Name,
                IsHidden = galleryDto.IsHidden
            };
            _context.Galleries.Add(gallery);
            await _context.SaveChangesAsync();

            galleryDto.Id = gallery.Id;
            return CreatedAtAction(nameof(GetGalleries), new { id = gallery.Id }, galleryDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGallery(int id, [FromBody] GalleryDto galleryDto)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery == null)
                return NotFound();

            gallery.Name = galleryDto.Name;
            gallery.IsHidden = galleryDto.IsHidden;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGallery(int id)
        {
            var gallery = await _context.Galleries.FindAsync(id);
            if (gallery == null)
                return NotFound();

            // Па жаданні: таксама выдаліць усе фота з гэтай галерэі
            var photosToRemove = _context.Photos.Where(p => p.GalleryId == id);
            _context.Photos.RemoveRange(photosToRemove);

            _context.Galleries.Remove(gallery);
            await _context.SaveChangesAsync();

            return NoContent();
        }

    }

}

