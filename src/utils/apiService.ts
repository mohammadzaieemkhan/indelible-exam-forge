
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Send WhatsApp notification
 */
export const sendWhatsAppNotification = async (
  phoneNumber: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: { phoneNumber, message }
    });

    if (error) {
      console.error("Error sending WhatsApp notification:", error);
      toast({
        title: "Notification Error",
        description: "Failed to send WhatsApp notification",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }

    toast({
      title: "Notification Sent",
      description: "WhatsApp notification sent successfully",
    });
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("Error invoking send-whatsapp-notification function:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Use Gemini AI for various tasks
 */
export const useGeminiAI = async (
  params: {
    prompt?: string;
    task: "generate_questions" | "evaluate_answer" | "performance_insights";
    syllabus?: string;
    topics?: string[];
    difficulty?: string;
    questionTypes?: string[];
    numberOfQuestions?: number;
  }
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    console.log("Calling Gemini AI with params:", params);
    
    // Ensure all required parameters are provided
    if (!params.task) {
      return { 
        success: false, 
        error: "Task parameter is required" 
      };
    }
    
    // Add validation and defaults
    if (params.task === "generate_questions") {
      if (!params.topics || params.topics.length === 0) {
        params.topics = ["General Knowledge"];
      }
      
      if (!params.numberOfQuestions || params.numberOfQuestions <= 0) {
        params.numberOfQuestions = 10;
      }
    }
    
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: params
    });

    if (error) {
      console.error("Error using Gemini AI:", error);
      toast({
        title: "AI Generation Error",
        description: "Failed to generate content with AI",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
    
    console.log("Gemini AI response:", data);
    
    if (!data || !data.response) {
      toast({
        title: "AI Response Error",
        description: "Received an empty response from AI",
        variant: "destructive",
      });
      return { 
        success: false, 
        error: "Received an empty response from AI" 
      };
    }
    
    return { success: true, response: data.response };
  } catch (error) {
    console.error("Error invoking gemini-ai function:", error);
    toast({
      title: "AI Generation Error",
      description: "An unexpected error occurred",
      variant: "destructive",
    });
    return { success: false, error: error.message };
  }
};
