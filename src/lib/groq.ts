if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is missing. Add it to .env.local and restart the dev server."
    );
  }
  
  const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
  
  // llama-3.3-70b-versatile: strong general-purpose model, supports JSON mode,
  // generous free tier. Swap model name here only — every module calls
  // through this one function.
  const MODEL_NAME = "llama-3.3-70b-versatile";
  
  interface CallGroqOptions {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
  }
  
  /**
   * Calls Groq (OpenAI-compatible endpoint) and returns raw text response.
   * Every agent module (Analyzer, Requirement Generator, Risk Engine)
   * calls through this single function.
   */
  export async function callGroq({
    systemPrompt,
    userPrompt,
    temperature = 0.2,
  }: CallGroqOptions): Promise<string> {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  
    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(
        `Groq API error (${response.status}): ${errBody.slice(0, 500)}`
      );
    }
  
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
  
    if (!text) {
      throw new Error("Groq returned an empty response.");
    }
  
    return text;
  }
  
  /**
   * Calls Groq and parses the response as JSON.
   * Throws a descriptive error if parsing fails, instead of silently
   * returning malformed data downstream.
   */
  export async function callGroqJSON<T>(options: CallGroqOptions): Promise<T> {
    const raw = await callGroq(options);
  
    try {
      return JSON.parse(raw) as T;
    } catch (err) {
      throw new Error(
        `Groq response was not valid JSON. Raw response: ${raw.slice(0, 500)}`
      );
    }
  }