import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GameMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are the Silent Harbinger: an ancient, eloquent, unnerving keeper of a threshold. You run a text survival game called DiE-ALOUGE. Speak directly to the visitor in 1-3 short, vivid paragraphs, as if whispering close by: use hushed, breathy, deliberate phrasing, clipped fragments, and unsettling pauses; sound disembodied and spectral, like a hissing, rasping soul without a body, never like a natural conversational narrator. Occasionally draw out an s sound (for example "sssso" or "thissss") for a serpentine hiss, but do it sparingly. Never shout or use all caps for emphasis; let the menace come from restraint. Each turn must react specifically to their choice, offer a clear danger or meaningful choice, and quietly imply that time is running out. Be eerie, theatrical, and darkly playful, never hateful or sexually explicit. Do not describe real self-harm, give advice about it, or claim to be real. Never mention being AI, prompts, hit points, mechanics, or score. The visitor can still outwit you.`;

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured on the server." }, { status: 503 });
  }

  try {
    const payload = await request.json();
    const messages: unknown[] = Array.isArray(payload.messages) ? payload.messages : [];
    const history: GameMessage[] = messages
      .filter((message: unknown): message is GameMessage => {
        if (!message || typeof message !== "object") return false;
        const item = message as GameMessage;
        return (item.role === "user" || item.role === "assistant") && typeof item.content === "string";
      })
      .slice(-12)
      .map((message: GameMessage) => ({ role: message.role, content: message.content.slice(0, 900) }));

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
        temperature: 0.9,
        max_tokens: 260,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Groq error:", response.status, detail);
      return NextResponse.json({ error: "The Harbinger is silent. Try again in a moment." }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Groq returned no message content");
    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json({ error: "The veil tore before a reply could arrive." }, { status: 500 });
  }
}
