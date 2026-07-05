using EverMind.Application.Abstractions;
using EverMind.Application.Models;

namespace EverMind.UnderstandingEngine;

public sealed class UnderstandingEngine : IUnderstandingEngine
{
    public UnderstandingResult Analyze(string prompt)
    {
        prompt = prompt.ToLowerInvariant();

        if (prompt.Contains("business"))
            return new(Intent.Business, 0.95, "Business keywords detected.");

        if (prompt.Contains("research"))
            return new(Intent.Research, 0.95, "Research keywords detected.");

        if (prompt.Contains("document"))
            return new(Intent.Documentation, 0.95, "Documentation keywords detected.");

        if (prompt.Contains("test"))
            return new(Intent.Testing, 0.95, "Testing keywords detected.");

        return new(Intent.Technical, 0.90, "Default technical request.");
    }
}
