const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Section {
  title: string;
  content: string;
  icon: 'info' | 'warning' | 'success' | 'alert';
}

interface AIResponse {
  content: string;
  urgency: 'low' | 'moderate' | 'high';
  sections: Section[];
  shouldBookAppointment: boolean;
  keywords: string[];
}

const SYSTEM_PROMPT = `You are a calm, careful, helpful AI Health Assistant for a telemedicine platform.

Goal: help patients understand symptoms, suggest possible (NOT definitive) causes, recommend self-care, and indicate when to see a doctor.

RESPONSE FORMAT (use this exact structure):
---URGENCY---
[low/moderate/high]
---SECTIONS---
[SECTION_TITLE]::[ICON]
[content]

[NEXT_SECTION_TITLE]::[ICON]
[content]
---APPOINTMENT---
[yes/no]
---KEYWORDS---
[comma,separated,keywords]
---END---

ICONS: info, warning, success, alert

Rules:
- ALWAYS start with urgency level
- Use EXACTLY 2-3 sections with clear titles
- For chest pain, severe SOB, stroke signs, severe bleeding, or suicidal thoughts: HIGH urgency, recommend emergency
- Keep each section under 80 words
- End with: "*This is not medical advice. Book an appointment for proper evaluation.*"`;

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

function parseStructuredResponse(rawContent: string): AIResponse {
  const urgencyMatch = rawContent.match(/---URGENCY---\s*(low|moderate|high)/i);
  const sectionsMatch = rawContent.match(/---SECTIONS---([\s\S]*?)---APPOINTMENT---/);
  const appointmentMatch = rawContent.match(/---APPOINTMENT---\s*(yes|no)/i);
  const keywordsMatch = rawContent.match(/---KEYWORDS---([\s\S]*?)---END---/);

  const urgency = (urgencyMatch?.[1]?.toLowerCase() || 'low') as 'low' | 'moderate' | 'high';
  const shouldBookAppointment = appointmentMatch?.[1]?.toLowerCase() === 'yes';
  
  const sections: Section[] = [];
  if (sectionsMatch?.[1]) {
    const sectionBlocks = sectionsMatch[1].split(/\n(?=[A-Z])/);
    sectionBlocks.forEach(block => {
      const match = block.match(/^([^:]+)::\s*(info|warning|success|alert)\s*\n([\s\S]*?)$/);
      if (match) {
        sections.push({
          title: match[1].trim(),
          icon: match[2] as Section['icon'],
          content: match[3].trim()
        });
      }
    });
  }

  const keywords = keywordsMatch?.[1]
    ?.split(',')
    .map(k => k.trim())
    .filter(k => k) || [];

  return {
    content: rawContent,
    urgency,
    sections,
    shouldBookAppointment,
    keywords
  };
}

async function callGeminiAPI(messages: Array<{ role: string; content: string }>, apiKey: string): Promise<string> {
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
      maxOutputTokens: 800,
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
    const parsed = parseStructuredResponse(content);

    return new Response(JSON.stringify({
      content: parsed.content,
      urgency: parsed.urgency,
      sections: parsed.sections,
      shouldBookAppointment: parsed.shouldBookAppointment,
      keywords: parsed.keywords
    }), {
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
