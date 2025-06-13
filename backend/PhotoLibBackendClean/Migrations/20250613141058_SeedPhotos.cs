using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PhotoLibBackendClean.Migrations
{
    /// <inheritdoc />
    public partial class SeedPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Photos",
                columns: new[] { "Id", "Description", "ExifData", "ImageData", "Latitude", "Longitude", "Title", "Url" },
                values: new object[,]
                {
                    { 1, "Гэта тэставае апісанне", "EXIF: ISO 100, f/2.8", null, 53.899999999999999, 27.566700000000001, "Тэставае фота", "https://example.com/photo1.jpg" },
                    { 2, "Апісанне другога фота", "EXIF: ISO 200, f/5.6", null, 52.0, 21.0, "Другое фота", "https://example.com/photo2.jpg" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Photos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Photos",
                keyColumn: "Id",
                keyValue: 2);
        }
    }
}
