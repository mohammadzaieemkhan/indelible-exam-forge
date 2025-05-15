
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing image data" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log("Making OCR request to Gemini API...");

    // Call Gemini API with the image for OCR
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: "Extract text from this image of handwritten content. Return only the extracted text without any additional comments."
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Error from Gemini API:", data);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error?.message || "Failed to extract text from image" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: response.status
        }
      );
    }

    // Extract the text from the Gemini response
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("Successfully extracted text from image");

    return new Response(
      JSON.stringify({
        success: true,
        data: { text: extractedText }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
    
  } catch (error) {
    console.error("Error in OCR function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An unexpected error occurred"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
