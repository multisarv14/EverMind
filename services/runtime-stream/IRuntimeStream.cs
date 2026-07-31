namespace EverMind.RuntimeStream;

public interface IRuntimeStream
{
    IReadOnlyList<RuntimeEvent> Events { get; }

    void Publish(string stage, string message);

    void Clear();
}
