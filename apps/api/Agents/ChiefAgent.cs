using EverMind.API.Models;

namespace EverMind.API.Agents;

public class ChiefAgent
{
    public ChatResponse Execute(ChatRequest request)
    {
        return new ChatResponse
        {
            Response = $"Hello, I am EverMind. You said: {request.Message}"
        };
    }
}
