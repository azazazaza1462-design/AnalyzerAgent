using Lendlogic.Agent.Core.Analysis;
using Lendlogic.Agent.Core.Claude;

namespace Lendlogic.Agent.Core.Imaging;

/// <summary>
/// Turns a downloaded attachment into images Claude vision can read: image/*
/// passes through; PDFs are rasterized one image per page.
/// </summary>
public interface IImageRasterizer
{
    IReadOnlyList<ClaudeImage> ToImages(AnalyzerFile file);
}
