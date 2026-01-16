import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, action } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "improve":
        systemPrompt = "You are a task improvement assistant. Rewrite the given task to be clearer, more actionable, and easier to understand. Keep it concise (under 15 words). Return only the improved task text, nothing else.";
        userPrompt = `Improve this task: "${task}"`;
        break;
      case "shorten":
        systemPrompt = "You are a task simplification assistant. Shorten the given task to its essential meaning while keeping it actionable. Maximum 8 words. Return only the shortened task text, nothing else.";
        userPrompt = `Shorten this task: "${task}"`;
        break;
      case "professional":
        systemPrompt = "You are a professional writing assistant. Rewrite the given task in a formal, professional tone suitable for a business environment. Keep it under 15 words. Return only the professional version, nothing else.";
        userPrompt = `Make this task professional: "${task}"`;
        break;
      case "breakdown":
        systemPrompt = "You are a task breakdown assistant. Break down the given task into 3-5 smaller, actionable subtasks. Return ONLY a JSON array of strings, each string being a subtask. Example: [\"Subtask 1\", \"Subtask 2\", \"Subtask 3\"]";
        userPrompt = `Break down this task into subtasks: "${task}"`;
        break;
      default:
        throw new Error("Invalid action");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim() || "";

    // For breakdown action, parse the JSON array
    if (action === "breakdown") {
      try {
        // Try to extract JSON array from the response
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback: split by newlines or numbered items
          result = result
            .split(/\n|(?:\d+\.?\s*)/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        }
      } catch (e) {
        console.error("Failed to parse breakdown result:", e);
        result = [result];
      }
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Task AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
