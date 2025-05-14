import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Send WhatsApp notification
 */
export const sendWhatsAppNotification = async (
  phoneNumber: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  try {
    // Validate phone number format
    if (!phoneNumber || phoneNumber.trim().length < 5) {
      toast({
        title: "Invalid Phone Number",
        description: "Please provide a valid phone number with country code",
        variant: "destructive",
      });
      return { success: false, error: "Invalid phone number" };
    }
    
    // Format the phone number if needed (ensure it has a + prefix)
    let formattedNumber = phoneNumber.trim();
    if (!formattedNumber.startsWith('+')) {
      // If no country code, assume US (+1)
      formattedNumber = '+1' + formattedNumber.replace(/[^\d]/g, '');
    }
    
    console.log("Sending WhatsApp notification to:", formattedNumber);
    console.log("Message:", message);
    
    // Call the Supabase edge function
    const { data, error } = await supabase.functions.invoke('send-whatsapp-notification', {
      body: { phoneNumber: formattedNumber, message }
    });

    if (error) {
      console.error("Error invoking send-whatsapp-notification function:", error);
      toast({
        title: "Notification Error",
        description: "Failed to send WhatsApp notification: " + error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
    
    console.log("WhatsApp function response:", data);
    
    // Check the detailed response from our function
    if (data.error) {
      toast({
        title: "WhatsApp Error",
        description: data.error || "Failed to send message. Check the phone number format and try again.",
        variant: "destructive",
      });
      return { success: false, error: data.error };
    }

    toast({
      title: "Notification Sent",
      description: "WhatsApp notification sent successfully. You may need to start the WhatsApp conversation with the Twilio number first.",
    });
    
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("Error sending WhatsApp notification:", error);
    toast({
      title: "Notification Error",
      description: "An unexpected error occurred when sending the notification",
      variant: "destructive",
    });
    return { success: false, error: error.message };
  }
};

/**
 * Parse syllabus content using Gemini AI
 */
export const parseSyllabusContent = async (
  syllabusContent: string
): Promise<{ success: boolean; topics?: string[]; error?: string }> => {
  try {
    console.log("Parsing syllabus content with Gemini AI");
    
    const { data, error } = await supabase.functions.invoke('gemini-ai', {
      body: {
        task: "parse_syllabus",
        syllabusContent
      }
    });

    if (error) {
      console.error("Error parsing syllabus with Gemini AI:", error);
      return { success: false, error: error.message };
    }
    
    if (!data || !data.response) {
      return { 
        success: false, 
        error: "Received an empty response when parsing syllabus" 
      };
    }
    
    // Extract topics from the AI response
    // This is a simplified implementation - in production you might want to parse the response more carefully
    const topicsText = data.response;
    const topics = topicsText
      .split(/[\n,:]/)
      .map((topic: string) => topic.trim())
      .filter((topic: string) => 
        topic && 
        !topic.toLowerCase().includes('topic') && 
        !topic.toLowerCase().includes('chapter') &&
        topic.length > 1
      );
    
    return { success: true, topics };
  } catch (error) {
    console.error("Error parsing syllabus:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Use Gemini AI for various tasks
 */
export const useGeminiAI = async (
  params: {
    prompt?: string;
    task: "generate_questions" | "evaluate_answer" | "performance_insights" | "parse_syllabus";
    syllabus?: string;
    syllabusContent?: string; 
    topics?: string[];
    difficulty?: string;
    questionTypes?: string[];
    numberOfQuestions?: number;
    organizeBySections?: boolean;
    sections?: {
      title: string;
      topics: string[];
      questionTypes: string[];
      numberOfQuestions: number;
      difficulty: string;
    }[];
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
        if (!params.sections || params.sections.length === 0) {
          params.topics = ["General Knowledge"];
        }
      }
      
      if (!params.numberOfQuestions || params.numberOfQuestions <= 0) {
        if (!params.sections || params.sections.length === 0) {
          params.numberOfQuestions = 10;
        }
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

/**
 * Helper function to convert file to text
 */
export const fileToText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target?.result as string);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    if (file.type === 'application/pdf') {
      // For PDFs, we can only read as array buffer
      reader.readAsArrayBuffer(file);
    } else {
      // For text files, read as text
      reader.readAsText(file);
    }
  });
};
