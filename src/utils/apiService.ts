
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
  }
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: params
    });

    if (error) {
      console.error("Error using Gemini AI:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, response: data.response };
  } catch (error) {
    console.error("Error invoking gemini-ai function:", error);
    return { success: false, error: error.message };
  }
};
