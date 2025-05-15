
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('Missing Gemini API key');
    }

    const { imageData } = await req.json();

    if (!imageData) {
      throw new Error('Image data is required');
    }

    // Extract the base64 content from the data URL
    const base64Content = imageData.split(',')[1];
    
    // Process image with Gemini Vision API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent?key=' + GEMINI_API_KEY, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Extract all text from this handwritten answer. Include paragraphs and maintain the original structure as much as possible. Return only the extracted text without any additional explanation or comments."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Content
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
    });

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data));

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    // Extract the text from the response
    const extractedText = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({
        success: true,
        extractedText
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing handwritten text:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
