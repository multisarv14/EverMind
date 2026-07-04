using EverMind.Application.Abstractions;

namespace EverMind.AIGateway;

public sealed class AIProvider : IAIProvider
{
    public Task<string> GenerateAsync(
        string prompt,
        CancellationToken cancellationToken = default)
    {
        return Task.FromResult(
            $"EverMind AI Response: {prompt}"
        );
    }
}
