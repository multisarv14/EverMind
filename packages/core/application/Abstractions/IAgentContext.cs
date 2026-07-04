namespace EverMind.Application.Abstractions;

public interface IAgentContext
{
    Guid SessionId { get; }

    string Input { get; }

    IDictionary<string, object> Data { get; }
}
