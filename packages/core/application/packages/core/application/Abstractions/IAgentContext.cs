namespace EverMind.Application.Abstractions;

public interface IAgentContext
{
    Guid SessionId { get; }

    string UserInput { get; }

    IDictionary<string, object> Memory { get; }
}
