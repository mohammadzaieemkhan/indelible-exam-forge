
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default system prompt for the AI
const DEFAULT_SYSTEM_PROMPT = "You are an AI assistant specialized in education, helping to create exam questions and evaluate answers based on educational content.";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, task, syllabus, syllabusContent, topics, difficulty, questionTypes, numberOfQuestions, sections } = await req.json();

    // Choose the appropriate system prompt based on the task
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    let userPrompt = prompt || "";
    
    // Enhance the prompt based on task type
    switch (task) {
      case "generate_questions":
        systemPrompt = "You are an AI specialized in creating educational exam questions. Generate challenging but fair questions STRICTLY based on the provided topics, sections and difficulty level. For MCQs, include 4 options with one correct answer clearly labeled. For essay questions, include a question with appropriate word count guidance. Format each question clearly with a number and make sure options are clearly labeled A, B, C, D for multiple choice.";
        
        // Check if we have sections defined
        if (sections && sections.length > 0) {
          // Build a structured prompt for sections
          let sectionsPrompt = "Create the following exam sections with clearly numbered questions:\n";
          
          sections.forEach((section, index) => {
            sectionsPrompt += `\nSECTION ${index + 1}: ${section.title || 'Untitled Section'}\n`;
            sectionsPrompt += `- ${section.numberOfQuestions || 5} questions\n`;
            sectionsPrompt += `- Question types: ${section.questionTypes.join(", ")}\n`;
            sectionsPrompt += `- Topics: ${section.topics.length > 0 ? section.topics.join(", ") : "General Knowledge"}\n`;
            sectionsPrompt += `- Difficulty: ${section.difficulty || "medium"}\n`;
          });
          
          sectionsPrompt += "\nIMPORTANT: ALL questions MUST be related to the specified topics. Do NOT include questions on any other topics. Format the questions clearly and ensure that each question is properly labeled with its section.";
          
          userPrompt = sectionsPrompt + "\n" + (userPrompt || "");
        } else {
          // Validate topics array
          const examTopics = Array.isArray(topics) && topics.length > 0 
            ? topics.join(", ") 
            : "General Knowledge";
          
          // Use the traditional approach with specific formatting instructions
          userPrompt = `Generate ${numberOfQuestions || 10} exam questions STRICTLY about the following topics: ${examTopics}. 
                     Difficulty level: ${difficulty || "medium"}.
                     Question types: ${Array.isArray(questionTypes) ? questionTypes.join(", ") : questionTypes || "multiple choice"}.
                     ${syllabus ? "Based on this syllabus: " + syllabus : ""}
                     ${syllabusContent ? "Based on this extracted syllabus content: " + syllabusContent : ""}
                     ${prompt || ""}
                     
                     Format Guidelines:
                     - Number each question clearly (1, 2, 3, etc.)
                     - For multiple choice questions, label options as A), B), C), D) and clearly indicate the correct answer after all options with "Answer: X"
                     - For true/false questions, provide the statement and indicate whether it's true or false at the end with "Answer: True/False"
                     - For short answer questions, include the expected answer length
                     - For essay questions, provide guidance on word count and key points to address
                     - IMPORTANT: ALL questions MUST be directly related to the specified topics. DO NOT generate questions on unrelated topics.
                     - IMPORTANT: Put the correct answer for MCQs on a separate line AFTER listing all options`;
        }
        break;
      case "evaluate_answer":
        systemPrompt = "You are an AI specialized in evaluating and grading student answers. Provide constructive feedback and suggestions for improvement.";
        break;
      case "performance_insights":
        systemPrompt = "You are an AI specialized in analyzing educational performance data and providing actionable insights to help students improve.";
        break;
      case "parse_syllabus":
        systemPrompt = "You are an AI specialized in extracting structured information from educational syllabi. Extract the main topics, subtopics, and key concepts that would be important for exam questions.";
        userPrompt = `Please analyze the following syllabus and extract the main topics that would be relevant for creating exam questions: ${syllabusContent}`;
        break;
    }

    console.log("Making request to Gemini API with prompt:", userPrompt);
    console.log("Using task:", task);

    // Make the request to Gemini API using the gemini-1.5-flash model
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model",
            parts: [{ text: "I understand. I'll help with this educational task and ensure questions are strictly relevant to the provided topics." }]
          },
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_ONLY_HIGH"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ]
      }),
    });

    const geminiData = await geminiResponse.json();
    console.log("Gemini API raw response:", JSON.stringify(geminiData, null, 2));
    
    // Safely extract the AI response text with better error handling
    let aiResponse = "";
    try {
      // Check if the expected structure exists
      if (geminiData.candidates && 
          geminiData.candidates[0] && 
          geminiData.candidates[0].content && 
          geminiData.candidates[0].content.parts && 
          geminiData.candidates[0].content.parts[0]) {
        
        aiResponse = geminiData.candidates[0].content.parts[0].text;
      } else if (geminiData.error) {
        // Handle API error
        console.error("Gemini API returned an error:", geminiData.error);
        aiResponse = `Error from Gemini API: ${geminiData.error.message || JSON.stringify(geminiData.error)}`;
      } else {
        // Handle unexpected response format
        console.error("Unexpected Gemini API response format:", geminiData);
        aiResponse = "The AI model returned an unexpected response format. Please try again.";
      }
    } catch (e) {
      console.error("Error parsing Gemini API response:", e, "Response:", geminiData);
      aiResponse = "Sorry, I couldn't process your request at this time.";
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        response: aiResponse,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // Log and return error response
    console.error("Error calling Gemini AI:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
