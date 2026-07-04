using EverMind.ChiefAgent;
using EverMind.API.Models;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddOpenApi();
builder.Services.AddSingleton<ChiefAgent>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapPost("/api/v1/kernel/execute",
    (ChatRequest request, ChiefAgent chiefAgent) =>
    {
        return Results.Ok(new
        {
            success = true,
            agent = chiefAgent.Name,
            message = $"EverMind received: {request.Message}",
            version = "0.1.0"
        });
    });

app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        Name = "EverMind OS",
        Version = "0.1.0",
        Status = "Running"
    });
});

app.Run();
