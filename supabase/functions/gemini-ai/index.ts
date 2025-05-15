import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default system prompt for the AI
const DEFAULT_SYSTEM_PROMPT = "You are an AI assistant specialized in education, helping to create exam questions and evaluate answers based on educational content.";

// Set timeout for Gemini API requests (in milliseconds)
const API_TIMEOUT = 30000;

// Helper function to handle API request with timeout
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, task, syllabus, syllabusContent, topics, difficulty, questionTypes, numberOfQuestions, examData } = await req.json();

    // Choose the appropriate system prompt based on the task
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    let userPrompt = prompt || "";
    
    // Enhance the prompt based on task type
    switch (task) {
      case "generate_questions":
        systemPrompt = "You are an AI specialized in creating educational exam questions. Generate challenging but fair questions STRICTLY based on the provided topics and difficulty level. For MCQs, include 4 options with one correct answer clearly labeled. For essay questions, include a question with appropriate word count guidance. Format each question clearly with a number and make sure options are clearly labeled A, B, C, D for multiple choice.";
        
        // Add formatting instructions specific to MCQs to ensure each option is on its own line
        const mcqFormatInstructions = `
        IMPORTANT FORMATTING INSTRUCTIONS FOR MULTIPLE CHOICE QUESTIONS:
        - For multiple choice questions, format each option on a SEPARATE LINE with a clear label (A, B, C, D).
        - DO NOT combine options into a single paragraph or string.
        - Each option MUST start with its label (A, B, C, D) followed by a parenthesis or period.
        - Put each option on a new line.
        - Example of CORRECT formatting:
          A) First option
          B) Second option
          C) Third option
          D) Fourth option
        - Clearly indicate the correct answer on a separate line AFTER all options with "Answer: X"
        `;
        
        // Remove section functionality and always use the traditional approach
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
                   - DO NOT create sections or group questions by sections
                   - Present questions in a flat, sequential list
                   - For multiple choice questions, label options as A), B), C), D) and clearly indicate the correct answer after all options with "Answer: X"
                   - Put EACH OPTION on a SEPARATE LINE with proper spacing between options
                   - For true/false questions, provide the statement and indicate whether it's true or false at the end with "Answer: True/False"
                   - For short answer questions, include the expected answer length
                   - For essay questions, provide guidance on word count and key points to address
                   - IMPORTANT: ALL questions MUST be directly related to the specified topics. DO NOT generate questions on unrelated topics.
                   - IMPORTANT: Put the correct answer for MCQs on a separate line AFTER listing all options
                   
                   ${mcqFormatInstructions}`;
        break;
        
      case "evaluate_answer":
        systemPrompt = "You are an AI specialized in evaluating and grading student answers. Provide constructive feedback and suggestions for improvement.";
        
        // Enhanced evaluation prompt if we have exam data
        if (examData) {
          console.log("Evaluating exam submission with Gemini AI");
          
          // Get the correct answers for comparison
          let correctAnswersMap = {};
          if (examData.questions && Array.isArray(examData.questions)) {
            examData.questions.forEach((q, idx) => {
              if (q.type === 'mcq' || q.type === 'trueFalse') {
                // For MCQ questions, convert index to question ID format used in the answers
                correctAnswersMap[`q${idx}`] = q.answer;
              }
            });
          }
          
          // Format questions and user responses for evaluation
          let formattedPrompt = `Evaluate the following exam responses:
        
      Exam: ${examData.examName}
      Topic(s): ${examData.topics ? examData.topics.join(", ") : "General Knowledge"}
      Difficulty: ${examData.difficulty || "medium"}
      
      Questions and Responses:
      `;
          
          // Add each question and response
          if (examData.questions && Array.isArray(examData.questions)) {
            examData.questions.forEach((q, idx) => {
              const questionId = `q${idx}`;
              const userAnswer = examData.answers && examData.answers[questionId] 
                ? examData.answers[questionId] 
                : "Not answered";
              
              const weight = examData.questionWeights?.[idx] || 1;
              const options = q.options && Array.isArray(q.options) 
                ? q.options.join(" | ") 
                : "No options provided";
              
              formattedPrompt += `
        Question ${idx + 1} (${q.type}, weight: ${weight}): ${q.question}
        Options: ${options}
        Correct Answer: ${correctAnswersMap[questionId] || "N/A"}
        User Answer: ${userAnswer}
        \n\n`;
            });
          }
          
          // Add evaluation instructions
          formattedPrompt += `
      For each question, provide:
      1. Whether the answer is correct (full points), partially correct (partial points), or incorrect (0 points)
      2. A brief explanation/feedback
      3. The points awarded out of the question weight
      
      Also provide:
      - Total score (sum of awarded points)
      - Total possible score (sum of question weights)
      - Percentage score
      - Performance breakdown by topic
      
      Use the following JSON format for your response:
      {
        "questionDetails": [
          {
            "question": "Question text",
            "type": "question type",
            "isCorrect": true/false/partial,
            "feedback": "Brief feedback",
            "marksObtained": number,
            "totalMarks": number,
            "userAnswer": "user's answer",
            "correctAnswer": "correct answer"
          }
        ],
        "totalScore": number,
        "totalPossible": number,
        "percentage": number,
        "topicPerformance": {
          "topic1": percentage,
          "topic2": percentage
        }
      }`;
          
          userPrompt = formattedPrompt;
        }
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

    // Make the request to Gemini API using the gemini-1.5-flash model with timeout
    const geminiResponse = await fetchWithTimeout(
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
      },
      API_TIMEOUT
    );

    const geminiData = await geminiResponse.json();
    
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
        throw new Error(`Error from Gemini API: ${geminiData.error.message || JSON.stringify(geminiData.error)}`);
      } else {
        // Handle unexpected response format
        console.error("Unexpected Gemini API response format:", geminiData);
        throw new Error("The AI model returned an unexpected response format. Please try again.");
      }
    } catch (e) {
      console.error("Error parsing Gemini API response:", e, "Response:", geminiData);
      throw new Error("Sorry, I couldn't process your request at this time.");
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
