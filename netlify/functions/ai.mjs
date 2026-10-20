export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (req.headers.get("x-passcode") !== Netlify.env.get("PASSCODE")) return new Response("Unauthorized", { status: 401 });
  let body;
  try { body = await req.json(); } catch { return new Response("Bad request", { status: 400 }); }
  const msgs = body.messages;
  if (!Array.isArray(msgs) || msgs.length > 14) return new Response("Bad request", { status: 400 });
  const clean = msgs.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 6000) }));
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer " + Netlify.env.get("OPENAI_API_KEY") },
    body: JSON.stringify({
      model: Netlify.env.get("OPENAI_MODEL") || "gpt-4o-mini",
      max_tokens: 2500,
      messages: [{ role: "system", content: "You are an accurate NEET-UG tutor for a student in Kerala. Follow NCERT. Follow the output format the student's message asks for exactly." }, ...clean]
    })
  });
  if (!r.ok) return new Response("Upstream error", { status: 502 });
  const d = await r.json();
  return Response.json({ text: d.choices?.[0]?.message?.content || "" });
};
export const config = { path: "/api/ai" };
