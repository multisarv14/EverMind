using EverMind.Application.Models;

namespace EverMind.Application.Abstractions;

public interface IUnderstandingEngine
{
    UnderstandingResult Analyze(string prompt);
}
