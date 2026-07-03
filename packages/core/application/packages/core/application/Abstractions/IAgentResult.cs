namespace EverMind.Application.Abstractions;

public interface IAgentResult
{
    bool Success { get; }

    string Response { get; }

    IReadOnlyDictionary<string, object> Metadata { get; }
}
