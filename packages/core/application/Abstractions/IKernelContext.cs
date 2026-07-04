namespace EverMind.Application.Abstractions;

public interface IKernelContext
{
    Guid SessionId { get; }

    string Prompt { get; }

    IDictionary<string, object> Items { get; }
}
