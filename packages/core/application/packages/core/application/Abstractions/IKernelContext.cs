namespace EverMind.Application.Abstractions;

public interface IKernelContext
{
    Guid SessionId { get; }

    string Input { get; }
}
