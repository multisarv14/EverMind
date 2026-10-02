using EverMind.API.Models;
using EverMind.Application.Abstractions;
using EverMind.Application.Kernel;
using EverMind.Application.Models;
using EverMind.ChiefAgent;

using EverMind.BusinessAgent;
using EverMind.TechnicalAgent;
using EverMind.ResearchAgent;
using EverMind.DocumentationAgent;
using EverMind.TestingAgent;

using EverMind.Orchestrator;
using EverMind.UnderstandingEngine;
using EverMind.RuntimeStream;
using EverMind.Memory;

var builder = WebApplication.CreateBuilder(args);

// OpenAPI
builder.Services.AddOpenApi();

// Runtime
builder.Services.AddSingleton<IUnderstandingEngine, UnderstandingEngine>();
builder.Services.AddSingleton<IOrchestrator, Orchestrator>();
builder.Services.AddSingleton<IRuntimeStream, RuntimeStream>();
builder.Services.AddSingleton<IMemoryStore, MemoryStore>();

// Agents
builder.Services.AddSingleton<IAgent, ChiefAgent>();
builder.Services.AddSingleton<IAgent, BusinessAgent>();
builder.Services.AddSingleton<IAgent, TechnicalAgent>();
builder.Services.AddSingleton<IAgent, ResearchAgent>();
builder.Services.AddSingleton<IAgent, DocumentationAgent>();
builder.Services.AddSingleton<IAgent, TestingAgent>();

// Kernel
builder.Services.AddSingleton<IKernel, Kernel>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapPost("/api/v1/kernel/execute",
async (
    ChatRequest request,
    IKernel kernel) =>
{
    var context = new KernelContext
    {
        SessionId = Guid.NewGuid(),
        Prompt = request.Message
    };

    var result = await kernel.RunAsync(context);

    return Results.Ok(new
    {
        success = result.Success,
        response = result.Message
    });
});


app.MapGet("/api/v1/runtime/stream",
async (HttpContext context, IRuntimeStream runtime) =>
{
    context.Response.Headers.Append("Content-Type", "text/event-stream");
    context.Response.Headers.Append("Cache-Control", "no-cache");

    var sent = 0;
    DateTime? runId = null;

    while (!context.RequestAborted.IsCancellationRequested)
    {
        var events = runtime.Events;

        // The orchestrator clears events at the start of every run; a run is
        // identified by the timestamp of its first event.
        DateTime? currentRun = events.Count > 0 ? events[0].Timestamp : null;

        if (events.Count < sent || currentRun != runId)
        {
            sent = 0;
            runId = currentRun;
        }

        while (sent < events.Count)
        {
            var e = events[sent++];

            await context.Response.WriteAsync(
                $"data: {System.Text.Json.JsonSerializer.Serialize(e)}\n\n");

            await context.Response.Body.FlushAsync();
        }

        await Task.Delay(200, context.RequestAborted);
    }
});



app.MapGet("/api/v1/memory",
(IMemoryStore memory) =>
{
    return Results.Ok(memory.GetAll());
});

app.MapGet("/api/v1/memory/latest",
(IMemoryStore memory) =>
{
    return Results.Ok(memory.GetLatest(10));
});

app.MapGet("/api/v1/memory/search",
(string q, IMemoryStore memory) =>
{
    return Results.Ok(memory.Search(q));
});

app.MapGet("/", () => Results.Ok(new
{
    Product = "EverMind AI OS",
    Runtime = "Kernel",
    Status = "Running",
    Version = "0.2.0"
}));

app.Run();
