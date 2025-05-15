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
 * Use Gemini AI for various tasks including exam evaluation
 */
export const useGeminiAI = async (
  params: {
    prompt?: string;
    task: "generate_questions" | "evaluate_answer" | "performance_insights" | "parse_syllabus";
    syllabus?: string;
    syllabusContent?: string; 
    topics?: string[];
    difficulty?: string;
    questionTypes?: string[] | string;
    numberOfQuestions?: number;
    examData?: any; // For exam evaluation
    sections?: {
      title: string;
      topics: string[];
      questionTypes: string[];
      numberOfQuestions: number;
      difficulty: string;
    }[];
  }
): Promise<{ success: boolean; response?: string; error?: string; evaluationResult?: any }> => {
  try {
    console.log("Calling Gemini AI with params:", params);
    
    // Ensure all required parameters are provided
    if (!params.task) {
      return { 
        success: false, 
        error: "Task parameter is required" 
      };
    }
    
    // Add validation and defaults for question generation
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
      
      // Convert questionTypes to array if it's a string
      if (typeof params.questionTypes === 'string') {
        params.questionTypes = [params.questionTypes];
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
        
        // Create or enhance the prompt with specific distribution instructions
        const basePrompt = params.prompt || "";
        
        // Add specific instruction to label each question with its type
        const distributionPrompt = `
Please create a balanced set of questions according to the specified distribution.

It's CRITICAL that you label each question with its type at the beginning of the question:
- For MCQs: "MCQ: [question]"
- For True/False: "True/False: [question]" (end with "Answer: True" or "Answer: False")
- For Short Answer: "Short Answer: [question]"
- For Essay: "Essay: [question]" (include expected word count like "(200-250 words)")

For MCQs, include 4 options labeled A, B, C, D and indicate the correct answer at the end with "Answer: [letter]".
For True/False questions, clearly state if the answer is True or False at the end with "Answer: True/False".
`;
        
        // Update the prompt if it doesn't already contain these instructions
        if (!basePrompt.includes("label each question with its type")) {
          params.prompt = basePrompt + "\n\n" + distributionPrompt;
        }
      }
    }
    
    // Enhancement for exam evaluation - completely revised for robust answer handling
    if (params.task === "evaluate_answer" && params.examData) {
      console.log("Evaluating exam submission with Gemini AI");
      
      // Thorough debugging of the exam data, especially the answers
      console.log("Exam data structure:", JSON.stringify(params.examData, null, 2));
      console.log("Answers for evaluation:", params.examData.answers);
      console.log("Question list:", params.examData.questions?.map(q => q.question).join('\n'));
      
      // Create a comprehensive mapping of answers with multiple key formats for robustness
      const formattedAnswers = {};
      
      // Handle object structure answers
      if (params.examData.answers && typeof params.examData.answers === 'object') {
        // Create multiple formats for robustness
        Object.entries(params.examData.answers).forEach(([key, value]) => {
          // Keep the original key-value pair
          formattedAnswers[key] = value;
          
          // Add alternative key formats for robustness
          if (key.startsWith('q')) {
            const index = parseInt(key.substring(1));
            if (!isNaN(index)) {
              // Add numeric index format
              formattedAnswers[index] = value;
              // Add alternative q format
              formattedAnswers[`question-${index}`] = value;
            }
          }
          
          // Handle nested answer objects - FIX HERE
          if (value && typeof value === 'object' && 'value' in value) {
            // Use type assertion or type guard to fix the TypeScript error
            formattedAnswers[key] = (value as { value: string }).value;
          }
        });
      }
      
      // Handle array structure answers
      if (params.examData.answers && Array.isArray(params.examData.answers)) {
        params.examData.answers.forEach((answer, index) => {
          formattedAnswers[`q${index}`] = answer;
          formattedAnswers[index] = answer;
        });
      }
      
      // Update the answers in the exam data
      params.examData.answers = formattedAnswers;
      
      console.log("Formatted answers for evaluation:", params.examData.answers);
    }
    
    // Make the API call with enhanced logging
    console.log("Making API call to gemini-ai with task:", params.task);
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
    
    // If this was an exam evaluation, process the results with enhanced robustness
    if (params.task === "evaluate_answer" && params.examData) {
      // Process evaluation response and calculate results with multiple fallbacks
      try {
        console.log("Processing evaluation response");
        // Try to parse the JSON response from Gemini with multiple approaches for robustness
        let evaluationData;
        const responseText = data.response;
        
        // Log the complete response for debugging
        console.log("Full evaluation response:", responseText);
        
        // Approach 1: Extract JSON from markdown code blocks
        if (responseText.includes('```json')) {
          const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            try {
              evaluationData = JSON.parse(jsonMatch[1].trim());
              console.log("Successfully parsed JSON evaluation from code block:", evaluationData);
            } catch (jsonError) {
              console.error("Error parsing JSON from code block:", jsonError);
            }
          }
        }
        
        // Approach 2: Look for any JSON object in the response
        if (!evaluationData) {
          try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              evaluationData = JSON.parse(jsonMatch[0]);
              console.log("Successfully parsed raw JSON evaluation:", evaluationData);
            }
          } catch (jsonError) {
            console.error("Error parsing raw JSON:", jsonError);
          }
        }
        
        // Approach 3: Try again with a more lenient regex
        if (!evaluationData) {
          try {
            // Find anything that looks like a JSON object starting with { and ending with }
            const jsonRegex = /(\{[\s\S]*?\})/g;
            const matches = responseText.match(jsonRegex);
            
            if (matches) {
              // Try each possible match
              for (const match of matches) {
                try {
                  const possibleJson = JSON.parse(match);
                  if (possibleJson.questionDetails && possibleJson.totalScore !== undefined) {
                    evaluationData = possibleJson;
                    console.log("Found valid evaluation JSON using lenient regex:", evaluationData);
                    break;
                  }
                } catch (e) {
                  // Continue to the next match
                }
              }
            }
          } catch (error) {
            console.error("Error with lenient JSON parsing:", error);
          }
        }
        
        // Store the evaluated results in localStorage
        const examResults = localStorage.getItem('examResults') ? 
          JSON.parse(localStorage.getItem('examResults')!) : [];
        
        // Use parsed data or create basic evaluation if parsing failed
        const evaluation = evaluationData || {
          questionDetails: params.examData.questions.map((q, idx) => {
            const questionId = `q${idx}`;
            let userAnswer = "Not answered";
            
            // Try multiple potential answer keys
            const possibleKeys = [
              questionId,
              idx.toString(),
              `question-${idx}`,
              `question-${questionId}`
            ];
            
            for (const key of possibleKeys) {
              if (params.examData.answers[key] !== undefined) {
                userAnswer = params.examData.answers[key];
                break;
              }
            }
            
            return {
              question: q.question,
              type: q.type,
              isCorrect: false,
              feedback: "The question was not answered or could not be evaluated.",
              marksObtained: 0,
              totalMarks: 1,
              userAnswer: userAnswer,
              correctAnswer: q.answer
            };
          }),
          totalScore: 0,
          totalPossible: params.examData.questions.length,
          percentage: 0,
          topicPerformance: {}
        };
        
        // Create a final result object with comprehensive data
        const result = {
          examId: params.examData.examId,
          examName: params.examData.examName,
          date: new Date().toISOString().split('T')[0],
          score: evaluation.totalScore || 0,
          totalMarks: evaluation.totalPossible || params.examData.questions.length,
          percentage: evaluation.percentage || 0,
          timeTaken: params.examData.timeTaken || "N/A",
          questionStats: {
            correct: evaluation.questionDetails?.filter(q => q.isCorrect === true).length || 0,
            incorrect: evaluation.questionDetails?.filter(q => q.isCorrect === false).length || 0,
            unattempted: evaluation.questionDetails?.filter(q => q.userAnswer === "Not answered").length || 0,
            total: params.examData.questions.length
          },
          topicPerformance: evaluation.topicPerformance || {},
          questionDetails: evaluation.questionDetails || [],
          questions: params.examData.questions,
          answers: params.examData.answers
        };
        
        // If no topic performance was provided, use the topics from the exam
        if (Object.keys(result.topicPerformance).length === 0 && params.examData.topics) {
          params.examData.topics.forEach(topic => {
            result.topicPerformance[topic] = result.percentage;
          });
        }
        
        console.log("Created exam result object:", result);
        
        // Add to results and save
        examResults.push(result);
        localStorage.setItem('examResults', JSON.stringify(examResults));
        
        // Mark exam as completed
        if (params.examData.examId) {
          console.log("Moving exam from upcoming to previous...");
          // Get existing exams
          const examsJson = localStorage.getItem('exams');
          if (examsJson) {
            const exams = JSON.parse(examsJson);
            // Find the exam
            const examIndex = exams.findIndex(e => e.id === params.examData.examId);
            if (examIndex !== -1) {
              // Mark the exam as completed
              exams[examIndex].completed = true;
              // Update localStorage
              localStorage.setItem('exams', JSON.stringify(exams));
              console.log("Exam successfully processed and moved to previous exams");
            }
          }
        }
        
        // Show success toast
        toast({
          title: "Exam Evaluated",
          description: `Your exam has been evaluated! Score: ${result.percentage}%`,
        });
        
        return { 
          success: true, 
          response: data.response,
          evaluationResult: result
        };
      } catch (evalError) {
        console.error("Error processing evaluation:", evalError);
        toast({
          title: "Evaluation Error",
          description: "There was an error evaluating your exam",
          variant: "destructive",
        });
      }
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
