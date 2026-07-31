using System.Collections.Concurrent;

namespace EverMind.RuntimeStream;

public sealed class RuntimeStream : IRuntimeStream
{
    private readonly ConcurrentQueue<RuntimeEvent> _events = new();

    public IReadOnlyList<RuntimeEvent> Events => _events.ToList();

    public void Publish(string stage, string message)
    {
        _events.Enqueue(new RuntimeEvent(
            stage,
            message,
            DateTime.UtcNow));

        while (_events.Count > 100)
            _events.TryDequeue(out _);
    }

    public void Clear()
    {
        while (_events.TryDequeue(out _)) { }
    }
}
