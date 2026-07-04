namespace EverMind.Application.Abstractions;

public interface IAgentResult
{
    bool Success { get; }

    string Message { get; }
}
