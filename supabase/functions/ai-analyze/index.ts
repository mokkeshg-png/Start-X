import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://esm.sh/openai@4.24.0";
import { generatePromptAndData } from "./prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { analysisType, teamId, studentId, inputData } = await req.json();

    if (!analysisType) {
      throw new Error("Missing analysisType");
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    // We use the auth token from the request to ensure RLS policies are applied for fetching
    const authHeader = req.headers.get("Authorization") || "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    // Initialize Admin Client (for inserting into ai_analysis)
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // 1. Fetch required data based on analysis type using the user's client (enforces RLS)
    const { systemPrompt, userMessage, inputReference } = await generatePromptAndData(
      analysisType, 
      teamId, 
      studentId, 
      inputData,
      supabaseClient
    );

    // 2. Call OpenAI API
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    
    const openai = new OpenAI({ apiKey: openAIApiKey });
    const model = Deno.env.get("OPENAI_MODEL") || "gpt-3.5-turbo";

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" }
    });

    const resultText = completion.choices[0].message.content;
    if (!resultText) {
      throw new Error("Empty response from OpenAI");
    }
    
    const resultJson = JSON.parse(resultText);

    // 3. Save to ai_analysis table using admin client
    const { data: savedAnalysis, error: dbError } = await supabaseAdmin
      .from("ai_analysis")
      .insert({
        team_id: teamId || null,
        student_id: studentId || null,
        analysis_type: analysisType,
        input_reference: inputReference,
        result_json: resultJson,
        summary: resultJson.summary || "AI Analysis Completed",
        confidence: resultJson.confidence || null
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database Error:", dbError);
      throw new Error("Failed to save analysis results");
    }

    // 4. Return result
    return new Response(JSON.stringify({ success: true, data: savedAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in ai-analyze function:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.message === "Unauthorized" ? 401 : 400,
    });
  }
});
