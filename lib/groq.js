const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function summarize(prompt, { maxTokens = 400 } = {}) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Groq request failed: ${res.status} ${errText}`.trim());
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
