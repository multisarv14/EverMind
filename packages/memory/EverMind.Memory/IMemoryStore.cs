using EverMind.Memory.Models;

namespace EverMind.Memory;

public interface IMemoryStore
{
    void Save(MemoryRecord record);

    IReadOnlyList<MemoryRecord> GetAll();

    IReadOnlyList<MemoryRecord> GetLatest(int count);

    IReadOnlyList<MemoryRecord> Search(string keyword);
}
