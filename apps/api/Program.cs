using EverMind.API.Agents;
using EverMind.API.Models;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddOpenApi();
builder.Services.AddSingleton<ChiefAgent>();

var app = builder.Build();

// OpenAPI
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// EverMind Kernel Endpoint
app.MapPost("/api/v1/kernel/execute",
    (ChatRequest request, ChiefAgent chiefAgent) =>
    {
        return Results.Ok(chiefAgent.Execute(request));
    })
.WithName("EverMindKernel");

// Health Check
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
