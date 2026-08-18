using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace MotionPortfolio.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StoriesController : ControllerBase
    {
        // Əgər Entity Framework (Database) istifadə edirsinizsə, buraya DbContext əlavə oluna bilər.
        // Hələlik sadə və sürətli işləməsi üçün yaddaşda və ya JSON faylda saxlaya bilərik, 
        // yaxud bazadakı mövcud cədvəlinizə bağlaya bilərik.
        
        private static readonly List<StoryItem> _stories = new();

        [HttpGet]
        public IActionResult GetStories()
        {
            return Ok(_stories);
        }

        [HttpPost]
        public IActionResult AddStory([FromBody] StoryItem newItem)
        {
            if (string.IsNullOrEmpty(newItem.MediaUrl))
                return BadRequest("Media URL tələb olunur.");

            newItem.Id = _stories.Count > 0 ? _stories[^1].Id + 1 : 1;
            newItem.CreatedAt = DateTime.Now;
            _stories.Add(newItem);

            return Ok(newItem);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteStory(int id)
        {
            var story = _stories.Find(s => s.Id == id);
            if (story == null) return NotFound("Story tapılmadı.");

            _stories.Remove(story);
            return Ok(new { message = "Silindi" });
        }
    }

   public class StoryItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string MediaUrl { get; set; } = string.Empty;
        public string MediaType { get; set; } = string.Empty; // "image" və ya "video"
        public DateTime CreatedAt { get; set; }
    }
}