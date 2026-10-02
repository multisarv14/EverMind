// A tiny fake of the Anthropic Messages API, so tests never need a real key or spend money.
import http from "node:http";

const PORT = Number(process.env.MOCK_CLAUDE_PORT ?? 9999);

http
  .createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const j = JSON.parse(body || "{}");
      const last = String(j.messages?.at(-1)?.content ?? "");
      const props = j.output_config?.format?.schema?.properties ?? {};
      const usage = { input_tokens: 5, output_tokens: 20 };

      if (j.stream !== true) {
        let text = "ok";
        if (props.facts) text = JSON.stringify({ facts: [{ text: "The company sells AI CRM software to small clinics in Pune." }, { text: "Preference: the CEO wants short answers." }] });
        if (props.tasks) text = JSON.stringify({ tasks: [{ title: "Interview ten customers" }, { title: "Build the MVP" }] });
        if (props.agents) text = JSON.stringify({ agents: [{ id: "finance", reason: "Cash matters." }, { id: "nope", reason: "invalid id" }, { id: "legal", reason: "Compliance." }] });
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: j.model, content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage }));
      }

      res.writeHead(200, { "content-type": "text/event-stream" });
      const ev = (t, d) => res.write(`event: ${t}\ndata: ${JSON.stringify({ type: t, ...d })}\n\n`);
      ev("message_start", { message: { id: "m", type: "message", role: "assistant", model: j.model, content: [], stop_reason: null, usage: { input_tokens: 5, output_tokens: 0 } } });
      ev("content_block_start", { index: 0, content_block: { type: "text", text: "" } });
      ev("content_block_delta", { index: 0, delta: { type: "text_delta", text: `Reply to: ${last.slice(0, 60)} [agent:${/You act as the company's ([A-Za-z ]+Agent)/.exec(String(j.system))?.[1] ?? "none"}] [depth:${/Depth: (BASIC|ADVANCED)/.exec(String(j.system))?.[1] ?? "?"}]` } });
      ev("content_block_stop", { index: 0 });
      ev("message_delta", { delta: { stop_reason: "end_turn", stop_sequence: null }, usage: { output_tokens: 20 } });
      ev("message_stop", {});
      res.end();
    });
  })
  .listen(PORT, () => console.log(`mock claude on ${PORT}`));
