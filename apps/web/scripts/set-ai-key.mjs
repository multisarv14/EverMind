#!/usr/bin/env node
// Connects EverMind to an AI provider. The key is tested, encrypted with AI_KEY_SECRET and saved in the
// database (settings collection, document "ai"); it never goes into the code or a file. The running app picks
// up a change within 30 seconds, no restart needed. Run from apps/web:
//
//   node --env-file=.env.local scripts/set-ai-key.mjs set <groq|gemini|openrouter|anthropic> [model] [learning-model]
//   node --env-file=.env.local scripts/set-ai-key.mjs show       which provider, model and key (last 4 characters) are in use
//   node --env-file=.env.local scripts/set-ai-key.mjs remove     forget the saved key (falls back to ANTHROPIC_API_KEY, if set)
//
// "set" asks for the key without showing it. To pipe it instead: printf %s "$KEY" | node ... set groq
import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { connect } from "./firestore.mjs";

const PROVIDERS = {
  groq: { baseUrl: "https://api.groq.com/openai/v1", model: "openai/gpt-oss-120b" },
  gemini: { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-flash-latest" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1", model: "" },
  anthropic: { baseUrl: "https://api.anthropic.com/v1", model: "claude-opus-5-5" },
};

const [cmd, ...args] = process.argv.slice(2);

// Same scheme as src/lib/secretBox.ts; keep the two in step.
function seal(plain) {
  const secret = process.env.AI_KEY_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AI_KEY_SECRET is missing or shorter than 32 characters. Add one to .env.local:\n  echo "AI_KEY_SECRET=$(node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))")" >> .env.local'
    );
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return { iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), data: data.toString("base64") };
}

async function readKey() {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    let piped = "";
    for await (const chunk of stdin) piped += chunk;
    return piped.trim();
  }
  process.stdout.write("Paste the API key (it will not be shown), then press Enter: ");
  return new Promise((resolve) => {
    let key = "";
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    const onData = (text) => {
      for (const ch of text) {
        if (ch === "\u0003") process.exit(1); // Ctrl+C
        if (ch === "\r" || ch === "\n") {
          stdin.setRawMode(false);
          stdin.off("data", onData);
          stdin.pause();
          process.stdout.write("\n");
          return resolve(key.trim());
        }
        key = ch === "\u007f" ? key.slice(0, -1) : key + ch;
      }
    };
    stdin.on("data", onData);
    stdin.resume();
  });
}

/** One tiny request, so a wrong key or model is caught now and not by the first user. */
async function testKey(provider, key, model) {
  const { baseUrl } = PROVIDERS[provider];
  const res =
    provider === "anthropic"
      ? await fetch(`${baseUrl}/messages`, {
          method: "POST",
          headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
          body: JSON.stringify({ model, max_tokens: 20, messages: [{ role: "user", content: "Say OK" }] }),
        })
      : await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
          body: JSON.stringify({ model, max_tokens: 200, messages: [{ role: "user", content: "Say OK" }] }),
        });
  if (!res.ok) throw new Error(`The ${provider} test call failed (HTTP ${res.status}): ${(await res.text()).slice(0, 300)}`);
}

async function set(db) {
  const [provider, modelArg, learningArg] = args;
  if (!PROVIDERS[provider]) throw new Error(`Provider must be one of: ${Object.keys(PROVIDERS).join(", ")}`);
  const model = modelArg || PROVIDERS[provider].model;
  if (!model) throw new Error(`Give a model for ${provider}, e.g. set ${provider} <model-id>`);

  const key = await readKey();
  if (key.length < 20) throw new Error("That does not look like an API key.");
  const sealed = seal(key);

  process.stdout.write(`Testing the key with ${provider} / ${model} ... `);
  await testKey(provider, key, model);
  console.log("OK");

  await db.collection("settings").doc("ai").set({
    provider,
    model,
    ...(learningArg ? { learningModel: learningArg } : {}),
    key: sealed,
    keyHint: key.slice(-4),
    updatedAt: new Date(),
  });
  console.log(`Saved. EverMind now uses ${provider} (${model}); the running app switches within 30 seconds.`);
}

async function show(db) {
  const doc = (await db.collection("settings").doc("ai").get()).data();
  if (!doc) return console.log("No key saved in the database." + (process.env.ANTHROPIC_API_KEY ? " Using ANTHROPIC_API_KEY from the environment." : ""));
  console.log(`Provider: ${doc.provider}\nModel: ${doc.model}${doc.learningModel ? `\nLearning model: ${doc.learningModel}` : ""}\nKey: ...${doc.keyHint}\nSaved: ${doc.updatedAt.toDate().toISOString()}`);
}

async function remove(db) {
  const ref = db.collection("settings").doc("ai");
  const existed = (await ref.get()).exists;
  await ref.delete();
  console.log(existed ? "Removed the saved key." : "There was no saved key.");
}

const commands = { set, show, remove };
if (!commands[cmd]) {
  console.log("Usage: node --env-file=.env.local scripts/set-ai-key.mjs <set <provider> [model] [learning-model] | show | remove>");
  process.exit(1);
}

try {
  await commands[cmd](connect());
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
