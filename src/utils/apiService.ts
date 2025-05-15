
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
): Promise<{ success: boolean; topics?: string[]; error?: string; markdown?: string }> => {
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
    
    // Format response as markdown
    const markdownContent = `# Syllabus Analysis

## Extracted Topics
${topics.map(topic => `- ${topic}`).join('\n')}

## Original AI Response
${data.response}
`;
    
    return { success: true, topics, markdown: markdownContent };
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
      
      // Enhanced prompt for better question generation by sections
      if (params.sections && params.sections.length > 0) {
        // Create a structured prompt for organized sections
        let sectionsPrompt = "Create the following organized exam sections with clearly labeled and numbered questions:\n\n";
        
        params.sections.forEach((section, index) => {
          sectionsPrompt += `SECTION ${index + 1}: ${section.title || 'Untitled Section'}\n`;
          sectionsPrompt += `- Number of questions: ${section.numberOfQuestions || 5}\n`;
          sectionsPrompt += `- Question types: ${section.questionTypes.join(", ")}\n`;
          sectionsPrompt += `- Topics: ${section.topics.join(", ")}\n`;
          sectionsPrompt += `- Difficulty: ${section.difficulty || "medium"}\n\n`;
        });
        
        sectionsPrompt += "\nIMPORTANT FORMATTING INSTRUCTIONS:\n";
        sectionsPrompt += "- Clearly label each section with its name\n";
        sectionsPrompt += "- Number questions sequentially within each section\n";
        sectionsPrompt += "- For multiple choice questions, format each option on a SEPARATE LINE with clear labels (A, B, C, D)\n";
        sectionsPrompt += "- Clearly indicate the correct answer for each question\n";
        sectionsPrompt += "- ALL questions MUST be directly related to the specified topics\n";
        
        // Update or create the prompt
        const basePrompt = params.prompt || "";
        params.prompt = basePrompt + "\n\n" + sectionsPrompt;
      }
      // Enhanced prompt for better question type distribution with specific counts
      else if (params.questionTypes && params.questionTypes.length > 0) {
        // Calculate how many questions of each type
        const typeCount = params.questionTypes.length;
        const totalQuestions = params.numberOfQuestions || 10;
        const baseCount = Math.floor(totalQuestions / typeCount);
        const remainder = totalQuestions % typeCount;
        
        const typeCounts = params.questionTypes.map((type, index) => {
          const count = index < remainder ? baseCount + 1 : baseCount;
          return { type, count };
        });
        
        // Create or enhance the prompt with specific distribution instructions
        const basePrompt = params.prompt || "";
        
        // Create a detailed distribution prompt
        const distributionPrompt = `
Please create a balanced set of questions with the following specific distribution:

${typeCounts.map(({ type, count }) => {
  let label = "";
  if (type === "mcq") label = "Multiple Choice Questions";
  else if (type === "truefalse") label = "True/False Questions";
  else if (type === "shortanswer") label = "Short Answer Questions";
  else if (type === "essay") label = "Essay Questions";
  
  return `- ${label}: ${count} questions`;
}).join('\n')}

It's CRITICAL that you follow these exact counts for each question type. For each question, make sure to clearly indicate the question type in the following format:

For MCQs: "MCQ: [question]"
For True/False: "True/False: [question]" (end with "Answer: True" or "Answer: False")
For Short Answer: "Short Answer: [question]"
For Essay: "Essay: [question]" (include expected word count like "(200-250 words)")

For MCQs, include 4 options labeled A, B, C, D and indicate the correct answer.
For True/False questions, clearly state if the answer is True or False.
`;
        
        // Update the prompt
        params.prompt = basePrompt + "\n\n" + distributionPrompt;
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

/**
 * Delete an exam by ID
 */
export const deleteExam = (examId: string): boolean => {
  try {
    // Get existing exams from localStorage
    const examsJson = localStorage.getItem('exams');
    if (!examsJson) {
      return false;
    }
    
    const exams = JSON.parse(examsJson);
    
    // Find the exam index
    const examIndex = exams.findIndex(exam => exam.id === examId);
    if (examIndex === -1) {
      return false;
    }
    
    // Remove the exam
    exams.splice(examIndex, 1);
    
    // Update localStorage
    localStorage.setItem('exams', JSON.stringify(exams));
    
    // Also remove from exam results if it exists there
    const resultsJson = localStorage.getItem('examResults');
    if (resultsJson) {
      const results = JSON.parse(resultsJson);
      const updatedResults = results.filter(result => result.examId !== examId);
      localStorage.setItem('examResults', JSON.stringify(updatedResults));
    }
    
    toast({
      title: "Exam Deleted",
      description: "The exam has been deleted successfully"
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting exam:", error);
    toast({
      title: "Delete Failed",
      description: "There was an error deleting the exam",
      variant: "destructive"
    });
    return false;
  }
};
