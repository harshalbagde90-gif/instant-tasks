import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task, action, language = 'English' } = await req.json();
    console.log(`Action: ${action}, Language: ${language}, Task: ${task}`);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (action) {
      case "improve":
        if (language === 'Hinglish') {
          systemPrompt = `You are a Hinglish Grammar and Typo Expert. Your goal is to transform messy Hinglish into clean, natural-sounding mission statements.
Rules:
1. Fix word order: If words are jumbled, re-arrange them.
2. Remove junk symbols: Remove '+', '>', '/', ';', '[', ']', '|' that don't belong.
3. Fix common typos: 'klro' -> 'karo', 'wna' -> 'chahta hoon', 'bna' -> 'bana', 'sa' -> 'as soon as'.
4. Preserve "Num guru".
5. Return ONLY the corrected text.

Examples:
- "website bna rha hu main aaj" -> "Main aaj website bana raha hoon"
- "mjhe kam klro h +>;" -> "Mujhe kaam karna hai"
- "proprety project per kam" -> "Property project par kaam"`;
        } else {
          systemPrompt = `You are an English Grammar and Spelling Expert. You transform messy, jumbled task text into clean, professional mission statements.
Rules:
1. Fix obvious spelling and typos (e.g., 'proprety' -> 'property', 'wna' -> 'want to', 'sa' -> 'as soon as').
2. Remove all unnecessary symbols (e.g., '[;', '+', '>', '/', '|') that disrupt the sentence.
3. Un-jumble words: Re-arrange words to make logical sense.
4. Capitalize the first letter and fix basic grammar.
5. Preserve brand names like "Num guru".
6. Return ONLY the final corrected text. NO QUOTES.

Examples:
- "com[;lete my proprety website as sona spossible" -> "Complete my property website as soon as possible"
- "i wna to make the proprety website sa possible" -> "I want to make the property website as soon as possible"
- "get groceries +> /; clean room" -> "Get groceries and clean the room"
- "complete have to I project today" -> "I have to complete the project today"
- "i m work per proprety website" -> "I am working on the property website"`;
        }
        userPrompt = `Refine this mission statement (${language}): "${task}"`;
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

    const modelName = "gemini-1.5-flash";
    console.log(`Executing ${action} using model: ${modelName}`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1, // Lower temperature for more accurate/consistent results
          topK: 1,
          topP: 1,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    let result = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // For breakdown action, parse the JSON array
    if (action === "breakdown") {
      try {
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
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
      JSON.stringify({ result, model: modelName }),
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
