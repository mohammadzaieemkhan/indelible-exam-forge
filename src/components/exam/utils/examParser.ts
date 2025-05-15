
import { IExam } from "@/components/ExamTabs";

export interface ParsedQuestionItem {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: string;
  type: string;
  points?: number;
}

// Parse questions from raw content with improved logic for better extraction of separately formatted options
export const parseQuestions = (content: string | any): ParsedQuestionItem[] => {
  // First ensure content is a string
  if (content === null || content === undefined) {
    console.error("Question content is null or undefined");
    return [];
  }
  
  // Convert to string if it's not already
  const contentStr = String(content);
  
  if (!contentStr || contentStr.trim() === '') {
    console.error("Empty question content");
    return [];
  }
  
  console.log("Parsing questions from content:", contentStr.substring(0, 100) + "...");

  try {
    const questions: ParsedQuestionItem[] = [];
    const lines = contentStr.split('\n');
    
    let currentQuestion: Partial<ParsedQuestionItem> | null = null;
    let inOptions = false;
    let questionNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for new question patterns
      const questionMatch = line.match(/^(\d+)[\.|\)]?\s+(.+)$/);
      const altQuestionMatch = line.match(/^Q(\d+)[\.|\)]?\s+(.+)$/);
      
      if (questionMatch || altQuestionMatch || line.toLowerCase().startsWith('question')) {
        // Save previous question if it exists
        if (currentQuestion && currentQuestion.question) {
          questions.push(currentQuestion as ParsedQuestionItem);
        }
        
        // Start new question
        questionNumber++;
        currentQuestion = {
          id: questionNumber,
          question: questionMatch ? questionMatch[2] : (altQuestionMatch ? altQuestionMatch[2] : line),
          options: [],
          type: 'mcq' // Default type
        };
        inOptions = false;
        
        // Look ahead to see if the next lines contain options
        let j = i + 1;
        while (j < lines.length && j < i + 5) {
          const nextLine = lines[j].trim();
          if (nextLine.match(/^[A-D][\.|\)]/) || nextLine.match(/^\([A-D]\)/) || 
              nextLine.match(/^[a-d][\.|\)]/) || nextLine.match(/^\([a-d]\)/)) {
            inOptions = true;
            break;
          }
          j++;
        }
      } 
      // Process option lines
      else if (currentQuestion && inOptions) {
        // Check for option format: A) Option text, (A) Option text, etc.
        const optionMatch = line.match(/^([A-Da-d])[\.|\)]|\(([A-Da-d])\)\s*(.+)$/);
        
        if (optionMatch) {
          const optionText = optionMatch[3] || line;
          currentQuestion.options!.push(optionText.trim());
        } else {
          // If it doesn't match option format but we're in options section, it might be part of the last option
          if (currentQuestion.options && currentQuestion.options.length > 0) {
            const lastOptionIndex = currentQuestion.options.length - 1;
            currentQuestion.options[lastOptionIndex] += " " + line;
          }
        }
      }
      // Continue processing question text if not in options yet
      else if (currentQuestion && !inOptions) {
        currentQuestion.question += " " + line;
      }
    }
    
    // Add the last question if it exists
    if (currentQuestion && currentQuestion.question) {
      questions.push(currentQuestion as ParsedQuestionItem);
    }
    
    console.log(`Successfully parsed ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error("Error parsing questions:", error);
    return [];
  }
};
