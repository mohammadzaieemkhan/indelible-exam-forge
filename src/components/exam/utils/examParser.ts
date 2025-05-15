
/**
 * Types for exam questions 
 */
export interface ParsedQuestionItem {
  question: string;
  type: "mcq" | "truefalse" | "shortanswer" | "essay";
  options?: string[];
  section?: string;
  correctAnswer?: string | number;
}

/**
 * Convert markdown content to HTML with basic formatting
 */
export const markdownToHtml = (markdown: string | any): string => {
  // If input is not a string, convert to JSON string
  if (typeof markdown !== 'string') {
    try {
      if (markdown && markdown.response) {
        // Handle case where the response is nested inside a response property
        return markdownToHtml(markdown.response);
      }
      return `<pre>${JSON.stringify(markdown, null, 2)}</pre>`;
    } catch (e) {
      return '<p>Unable to display content</p>';
    }
  }
  
  // Basic markdown processing
  return markdown
    // Convert headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Convert bold text (must come before lists)
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Convert lists
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
    // Convert italics
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\_(.*?)\_/gim, '<em>$1</em>')
    // Convert code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Convert links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Convert line breaks
    .replace(/\n/g, '<br>');
};

/**
 * Parse questions from various formats into a standardized structure
 */
export const parseQuestions = (questions: any): ParsedQuestionItem[] => {
  console.log("Parsing questions:", questions);
  
  if (!questions) {
    console.warn("No questions provided to parseQuestions");
    return [];
  }

  // If questions object has a response property (from the API), use that
  if (questions.response) {
    console.log("Questions has response property, using that:", questions.response);
    questions = questions.response;
  }

  // If questions is already an array of properly formatted questions
  if (Array.isArray(questions) && questions.length > 0 && questions[0].question) {
    console.log("Questions is already properly formatted array");
    return questions as ParsedQuestionItem[];
  }

  // If questions is a JSON string, parse it
  if (typeof questions === 'string') {
    try {
      // Check if it's already JSON
      const parsedQuestions = JSON.parse(questions);
      if (Array.isArray(parsedQuestions)) {
        console.log("Successfully parsed questions string as JSON array");
        return parsedQuestions as ParsedQuestionItem[];
      }
    } catch (e) {
      console.log("Questions is a string but not JSON, attempting to parse as markdown");
      
      // If it's a string but not JSON, it's likely markdown formatted questions
      // This is a simple parser for markdown formatted multiple choice questions
      try {
        const lines = questions.split('\n');
        const parsedQuestions: ParsedQuestionItem[] = [];
        let currentQuestion: Partial<ParsedQuestionItem> | null = null;
        let currentOptions: string[] = [];
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines
          if (!line) continue;
          
          // Check for question headers (numbered questions, multiple choice, etc.)
          const questionMatch = line.match(/^(?:\*\*)?(\d+\.?\)?\s*(?:Multiple Choice|Essay|True\/False|Short Answer):?)?(?:\*\*)?(.+)/i);
          
          if (questionMatch && (line.includes("Multiple Choice") || line.includes("Essay") || 
                               line.includes("True/False") || line.includes("Short Answer") ||
                               (line.match(/^\d+\./) && i > 0 && !lines[i-1].trim()))) {
            
            // If we were working on a question, save it before starting a new one
            if (currentQuestion && currentQuestion.question) {
              if (currentOptions.length > 0) {
                currentQuestion.options = currentOptions;
              }
              parsedQuestions.push(currentQuestion as ParsedQuestionItem);
            }
            
            // Determine question type
            let type: "mcq" | "truefalse" | "shortanswer" | "essay" = "mcq";
            if (line.toLowerCase().includes("essay")) type = "essay";
            else if (line.toLowerCase().includes("true/false")) type = "truefalse";
            else if (line.toLowerCase().includes("short answer")) type = "shortanswer";
            
            // Start a new question
            currentQuestion = {
              question: questionMatch[2] || line,
              type: type
            };
            currentOptions = [];
          }
          // Check for options (A, B, C, D or 1, 2, 3, 4)
          else if (line.match(/^(?:\*\*)?[A-D]\)(?:\*\*)?\s+.+/) || line.match(/^(?:\*\*)?[A-D]\.(?:\*\*)?\s+.+/)) {
            if (currentQuestion) {
              currentQuestion.type = "mcq";
              currentOptions.push(line);
            }
          }
          // Check for "Answer:" lines
          else if (line.toLowerCase().startsWith("answer:") && currentQuestion) {
            currentQuestion.correctAnswer = line.substring(7).trim();
          }
          // If we have a current question, add the line to its question text
          else if (currentQuestion && currentQuestion.question) {
            // If it's not an option or an answer marker, it's part of the question
            if (!line.match(/^[A-D][\.:\)]/) && !line.toLowerCase().startsWith("answer:")) {
              currentQuestion.question += " " + line;
            }
          }
        }
        
        // Don't forget to add the last question
        if (currentQuestion && currentQuestion.question) {
          if (currentOptions.length > 0) {
            currentQuestion.options = currentOptions;
          }
          parsedQuestions.push(currentQuestion as ParsedQuestionItem);
        }
        
        if (parsedQuestions.length > 0) {
          console.log("Successfully parsed markdown into", parsedQuestions.length, "questions");
          return parsedQuestions;
        }
      } catch (parseError) {
        console.error("Error parsing markdown questions:", parseError);
      }
    }
  }

  // If questions is an object with sections
  if (typeof questions === 'object' && questions !== null && !Array.isArray(questions)) {
    const parsedQuestions: ParsedQuestionItem[] = [];
    
    // Check if it's structured by sections
    Object.keys(questions).forEach(section => {
      if (Array.isArray(questions[section])) {
        questions[section].forEach((q: any) => {
          if (q && typeof q === 'object' && q.question) {
            parsedQuestions.push({
              ...q,
              section: section
            });
          }
        });
      }
    });
    
    if (parsedQuestions.length > 0) {
      console.log("Successfully parsed sectioned questions");
      return parsedQuestions;
    }
  }

  console.error("Could not parse questions, returning empty array:", questions);
  return [];
};
