namespace EverMind.Application.Models;

public sealed record UnderstandingResult(
    Intent Intent,
    double Confidence,
    string Reasoning
);
