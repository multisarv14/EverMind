using System.Collections.Concurrent;
using EverMind.Memory.Models;

namespace EverMind.Memory;

public sealed class MemoryStore : IMemoryStore
{
    private readonly ConcurrentQueue<MemoryRecord> _records = new();

    public void Save(MemoryRecord record)
    {
        _records.Enqueue(record);
    }

    public IReadOnlyList<MemoryRecord> GetAll()
    {
        return _records.ToList();
    }

    public IReadOnlyList<MemoryRecord> GetLatest(int count)
    {
        return _records
            .Reverse()
            .Take(count)
            .ToList();
    }

    public IReadOnlyList<MemoryRecord> Search(string keyword)
    {
        return _records
            .Where(x =>
                x.Objective.Contains(keyword, StringComparison.OrdinalIgnoreCase) ||
                x.Response.Contains(keyword, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }
}
