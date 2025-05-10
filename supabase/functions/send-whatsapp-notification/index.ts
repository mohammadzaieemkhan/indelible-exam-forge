
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

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
    const { phoneNumber, message } = await req.json();

    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: "Phone number and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the incoming request data for debugging
    console.log("Received request to send WhatsApp message:", { phoneNumber, messageLength: message.length });

    // Format the phone number for WhatsApp
    // Ensure it starts with "whatsapp:" prefix and has proper country code 
    let formattedRecipient = phoneNumber;
    
    // Add + if missing from the number
    if (!formattedRecipient.startsWith('+') && !formattedRecipient.startsWith('whatsapp:+')) {
      formattedRecipient = '+' + formattedRecipient;
    }
    
    // Add whatsapp: prefix if missing
    if (!formattedRecipient.startsWith('whatsapp:')) {
      formattedRecipient = `whatsapp:${formattedRecipient}`;
    }

    // Log the formatted recipient number
    console.log("Formatted recipient number:", formattedRecipient);
    console.log("Using Twilio WhatsApp number:", TWILIO_WHATSAPP_NUMBER);

    // Build the Twilio API URL for sending WhatsApp messages
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    // Create the form data for the Twilio API request
    const formData = new URLSearchParams();
    formData.append("From", TWILIO_WHATSAPP_NUMBER);
    formData.append("To", formattedRecipient);
    formData.append("Body", message);

    // Log what we're about to send
    console.log("Sending request to Twilio API...");

    // Make the request to Twilio API
    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();
    console.log("Twilio API response:", JSON.stringify(twilioData));

    // Return success response with more details
    return new Response(
      JSON.stringify({
        success: twilioData.sid ? true : false,
        messageId: twilioData.sid || null,
        status: twilioData.status || twilioData.code,
        error: twilioData.message || null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log and return error response with more details
    console.error("Error sending WhatsApp notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
