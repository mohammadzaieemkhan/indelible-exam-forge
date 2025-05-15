
import { IExam } from "@/components/ExamTabs";

export interface ParsedQuestionItem {
  type: 'mcq' | 'truefalse' | 'shortanswer' | 'essay';
  question: string;
  options?: string[];
  answer?: string;
  section?: string;
}

// Parse questions from raw content with improved logic for better extraction of separately formatted options
export const parseQuestions = (content: string | any): ParsedQuestionItem[] => {
  // First ensure content is a string
  if (!content || typeof content !== 'string') {
    console.error("Invalid question content format:", content);
    return [];
  }

  const questions: ParsedQuestionItem[] = [];
  const lines = content.split('\n');
  
  let currentQuestion: Partial<ParsedQuestionItem> | null = null;
  let currentOptions: string[] = [];
  let currentSection: string = '';
  let collectingOptions = false;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue; // Skip empty lines
    
    // Check for section headers
    // Enhanced section detection - include question type sections
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      currentSection = trimmedLine.replace(/\*\*/g, '');
      continue;
    }
    
    // Alternative section header detection
    if (/^(Section|SECTION|MCQ|Multiple Choice|TRUE\/FALSE|True\/False|SHORT ANSWER|Short Answer|ESSAY|Essay)[\s:]+(.+)$/i.test(trimmedLine)) {
      const match = trimmedLine.match(/^(Section|SECTION|MCQ|Multiple Choice|TRUE\/FALSE|True\/False|SHORT ANSWER|Short Answer|ESSAY|Essay)[\s:]+(.+)$/i);
      if (match) {
        currentSection = match[0].trim();
      } else {
        currentSection = trimmedLine;
      }
      continue;
    }
    
    // Even more section detection patterns
    if (/^(MCQ|Multiple Choice Questions|TRUE\/FALSE|True\/False Questions|SHORT ANSWER|Short Answer Questions|ESSAY|Essay Questions)$/i.test(trimmedLine)) {
      currentSection = trimmedLine.trim();
      continue;
    }
    
    // Detect questions by common patterns
    const questionRegex = /^(\d+[\.\)]|Question\s+\d+:)/i;
    if (questionRegex.test(trimmedLine)) {
      // Save the previous question if exists
      if (currentQuestion?.question) {
        questions.push({
          ...currentQuestion as ParsedQuestionItem,
          options: currentOptions.length > 0 ? [...currentOptions] : undefined,
          section: currentSection || undefined
        });
      }
      
      // Start a new question
      currentQuestion = {
        question: trimmedLine,
        type: determineQuestionType(trimmedLine, currentSection), // Use section to help determine type
        section: currentSection || undefined
      };
      currentOptions = [];
      collectingOptions = false;
    } 
    // Detect options with improved regex for options on separate lines
    else if (/^[A-D][\.\)][\s]*|^\([A-D]\)[\s]*/i.test(trimmedLine)) {
      // Clean the option text to remove "Correct Answer" markers
      let optionText = trimmedLine.trim();
      currentOptions.push(optionText);
      if (currentQuestion) {
        currentQuestion.type = 'mcq';
        collectingOptions = true;
      }
    }
    // Detect answer lines after options
    else if (/^Answer:[\s]*[A-D]$/i.test(trimmedLine) && currentQuestion) {
      const answerMatch = trimmedLine.match(/^Answer:[\s]*([A-D])$/i);
      if (answerMatch && currentQuestion) {
        currentQuestion.answer = answerMatch[1].trim();
        collectingOptions = false;
      }
    }
    // Detect true/false questions
    else if (/true|false/i.test(trimmedLine) && currentOptions.length < 2 && currentQuestion) {
      if (trimmedLine.toLowerCase().includes('true') || trimmedLine.toLowerCase().includes('false')) {
        if (currentQuestion && !currentQuestion.question.toLowerCase().includes('true or false')) {
          currentQuestion.type = 'truefalse';
        }
      }
    }
    // Detect essay questions by keywords
    else if (/essay|explain|describe|discuss|elaborate/i.test(trimmedLine) && currentQuestion) {
      currentQuestion.type = 'essay';
    }
    // Add the line to the current question if it's a continuation
    else if (currentQuestion && trimmedLine.length > 0) {
      // Check if it contains an answer
      if (trimmedLine.toLowerCase().includes('answer:') && !collectingOptions) {
        const answerMatch = trimmedLine.match(/answer:(.+)/i);
        if (answerMatch && currentQuestion) {
          currentQuestion.answer = answerMatch[1].trim();
        }
      } else {
        // If we're not collecting options, this is part of the question text
        if (!collectingOptions) {
          currentQuestion.question += ' ' + trimmedLine;
        }
        // If we are collecting options but this doesn't match the option pattern,
        // it could be additional text for the last option or the end of options
        else if (!/^[A-D][\.\)][\s]*|^\([A-D]\)[\s]*/i.test(trimmedLine) && 
                !/^Answer:[\s]*[A-D]$/i.test(trimmedLine)) {
          // If this line doesn't look like an answer line, it's probably continuation of the last option
          if (currentOptions.length > 0 && !trimmedLine.toLowerCase().includes('answer:')) {
            // Append to the last option rather than creating a new one
            currentOptions[currentOptions.length - 1] += ' ' + trimmedLine;
          } else {
            // Might be the end of options section
            collectingOptions = false;
          }
        }
      }
    }
  }
  
  // Add the last question
  if (currentQuestion?.question) {
    questions.push({
      ...currentQuestion as ParsedQuestionItem,
      options: currentOptions.length > 0 ? [...currentOptions] : undefined,
      section: currentSection || undefined
    });
  }
  
  return questions.map(q => {
    // If no options and not already marked as essay, mark as short answer
    if (!q.options || q.options.length === 0) {
      if (q.type !== 'essay') {
        return { ...q, type: 'shortanswer' };
      }
    }
    // Look for word count guidance in essay questions
    if (q.type === 'essay' && q.question.toLowerCase().includes('word count')) {
      const wordCountMatch = q.question.match(/word count:?\s*(\d+)[-–](\d+)/i);
      if (wordCountMatch) {
        const minWords = parseInt(wordCountMatch[1]);
        const maxWords = parseInt(wordCountMatch[2]);
        q.question = `${q.question} (${minWords}-${maxWords} words)`;
      }
    }
    return q;
  });
};

// Helper function to determine question type based on content and section
function determineQuestionType(question: string, section: string): 'mcq' | 'truefalse' | 'shortanswer' | 'essay' {
  const lowerSection = section.toLowerCase();
  const lowerQuestion = question.toLowerCase();
  
  // Determine by section
  if (lowerSection.includes('mcq') || lowerSection.includes('multiple choice')) {
    return 'mcq';
  }
  if (lowerSection.includes('true/false') || lowerSection.includes('true or false')) {
    return 'truefalse';
  }
  if (lowerSection.includes('short answer')) {
    return 'shortanswer';
  }
  if (lowerSection.includes('essay')) {
    return 'essay';
  }
  
  // Determine by question content
  if (lowerQuestion.includes('true or false')) {
    return 'truefalse';
  }
  if (lowerQuestion.includes('explain') || lowerQuestion.includes('describe') || 
      lowerQuestion.includes('discuss') || lowerQuestion.includes('essay')) {
    return 'essay';
  }
  
  // Default to MCQ if cannot determine
  return 'mcq';
}

// Simple function to convert markdown to HTML
export const markdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  // Basic markdown parsing - replace markdown syntax with HTML
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    
    // Emphasis (bold and italic)
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/_(.*?)_/gim, '<em>$1</em>')
    
    // Lists - Unordered
    .replace(/^\s*[-*+]\s+(.*$)/gim, '<ul><li>$1</li></ul>')
    // Lists - Ordered
    .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<ol><li>$2</li></ol>')
    
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
    
    // Code blocks
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    
    // Paragraphs
    .replace(/^\s*(\n)?(.+)/gim, function(m) {
      return /^\s*(<(\/)?(h|ul|ol|li|blockquote|pre|p))/i.test(m) ? m : '<p>' + m + '</p>';
    })
    
    // Line breaks
    .replace(/\n/gim, '<br />');
  
  // Fix duplicate tags caused by multi-line regex
  html = html.replace(/<\/ul>\s*<ul>/gim, '')
             .replace(/<\/ol>\s*<ol>/gim, '')
             .replace(/<\/p>\s*<p>/gim, '<br />');
  
  return html;
};
