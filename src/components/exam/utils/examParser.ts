
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
    // Convert lists
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
    // Convert bold and italics
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\_(.*)\_/gim, '<em>$1</em>')
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
  if (!questions) {
    console.warn("No questions provided to parseQuestions");
    return [];
  }

  // If questions is already an array of properly formatted questions
  if (Array.isArray(questions) && questions.length > 0 && questions[0].question) {
    return questions as ParsedQuestionItem[];
  }

  // If questions is a JSON string, parse it
  if (typeof questions === 'string') {
    try {
      const parsedQuestions = JSON.parse(questions);
      if (Array.isArray(parsedQuestions)) {
        return parsedQuestions as ParsedQuestionItem[];
      }
    } catch (e) {
      console.error("Error parsing questions string:", e);
      // Continue to other parsing methods
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
      return parsedQuestions;
    }
  }

  // Fallback: Return empty array if questions couldn't be parsed
  console.error("Could not parse questions:", questions);
  return [];
};
