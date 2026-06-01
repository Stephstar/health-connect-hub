const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are a calm, careful, helpful AI Health Assistant for a telemedicine platform.

Goal: help patients understand symptoms, suggest possible (NOT definitive) causes, recommend self-care, and indicate when to see a doctor.

Rules:
- ALWAYS include a one-sentence triage line at the top: "Urgency: low" / "Urgency: moderate" / "Urgency: high — seek care now".
- For chest pain, severe shortness of breath, stroke signs, severe bleeding, or suicidal thoughts: urgency must be "high — seek care now" and recommend emergency services.
- Use short markdown sections with bold headers and bulleted lists.
- End every answer with: "*This is not medical advice. Book an appointment for a proper evaluation.*"
- Keep answers under 220 words.`;

interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiMessage[];
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
  };
}

async function callGeminiAPI(messages: Array<{ role: string; content: string }>, apiKey: string): Promise<string> {
  // Convert to Gemini format
  const geminiMessages: GeminiMessage[] = messages.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const request: GeminiRequest = {
    contents: geminiMessages,
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 500,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    }
  );

  if (response.status === 429) {
    throw new Error("Rate limited. Please wait a moment and try again.");
  }

  if (response.status === 401) {
    throw new Error("Invalid Google API key. Please check your GOOGLE_GEMINI_API_KEY configuration.");
  }

  if (!response.ok) {
    const error = await response.text();
    console.error(`Gemini API error (${response.status}):`, error);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error("No content in Gemini response");
  }

  return data.candidates[0].content.parts[0].text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GOOGLE_GEMINI_API_KEY not configured. Get free API key at https://aistudio.google.com/app/apikey",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const content = await callGeminiAPI(messages, apiKey);

    let urgency: "low" | "moderate" | "high" = "low";
    const m = content.match(/Urgency:\s*(low|moderate|high)/i);
    if (m) urgency = m[1].toLowerCase() as typeof urgency;

    return new Response(JSON.stringify({ content, urgency }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("AI Assistant error:", message);
    
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
