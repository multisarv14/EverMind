using EverMind.Application.Abstractions;

namespace EverMind.Application.Models;

public sealed class KernelContext : IKernelContext
{
    public Guid SessionId { get; init; } = Guid.NewGuid();

    public string Prompt { get; init; } = string.Empty;

    public IDictionary<string, object> Items { get; } =
        new Dictionary<string, object>();
}
