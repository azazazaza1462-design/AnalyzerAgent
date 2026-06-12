using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Agent.Core.Claude;
using PDFtoImage;
using SkiaSharp;

namespace Lendlogic.Agent.Core.Imaging;

/// <summary>
/// Rasterizes attachments for Claude vision. image/* is passed through
/// unchanged; PDFs are rendered to PNG, one image per page (capped to keep the
/// request within Claude's image/token limits — IDs are 1–2 pages).
/// </summary>
public sealed class PdfImageRasterizer : IImageRasterizer
{
    private const int MaxPages = 4;

    public IReadOnlyList<ClaudeImage> ToImages(AnalyzerFile file)
    {
        var contentType = (file.ContentType ?? string.Empty).ToLowerInvariant();

        if (contentType.StartsWith("image/"))
            return [new ClaudeImage(contentType, file.Content)];

        var isPdf = contentType == "application/pdf"
            || file.FileName.EndsWith(".pdf", StringComparison.OrdinalIgnoreCase);

        if (!isPdf)
            throw new NotSupportedException(
                $"Cannot rasterize attachment '{file.FileName}' (content type '{contentType}').");

        var images = new List<ClaudeImage>();
        var page = 0;
        foreach (var bitmap in Conversion.ToImages(file.Content))
        {
            using (bitmap)
            {
                if (page++ >= MaxPages) break;
                using var data = bitmap.Encode(SKEncodedImageFormat.Png, 90);
                images.Add(new ClaudeImage("image/png", data.ToArray()));
            }
        }

        if (images.Count == 0)
            throw new InvalidOperationException($"PDF '{file.FileName}' produced no pages.");

        return images;
    }
}
