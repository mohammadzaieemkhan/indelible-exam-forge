
import { ParsedQuestion } from '../types/examTypes';

/**
 * Parse questions from the exam text
 * @param examText - The full exam text to parse
 * @returns Array of parsed questions
 */
export const parseQuestions = (examText: string): ParsedQuestion[] => {
  if (!examText) return [];

  // Improved regex patterns for different question types
  const mcqPattern = /(\d+)\.\s*(?:MCQ:|Multiple\s*Choice:?)\s*(.*?)(?=(?:\d+\.\s*(?:MCQ|Multiple\s*Choice|Short\s*Answer|Essay|True\/False|True\s*\/\s*False):?)|$)/gis;
  const shortAnswerPattern = /(\d+)\.\s*(?:Short\s*Answer:)\s*(.*?)(?=(?:\d+\.\s*(?:MCQ|Multiple\s*Choice|Short\s*Answer|Essay|True\/False|True\s*\/\s*False):?)|$)/gis;
  const essayPattern = /(\d+)\.\s*(?:Essay:)\s*(.*?)(?=(?:\d+\.\s*(?:MCQ|Multiple\s*Choice|Short\s*Answer|Essay|True\/False|True\s*\/\s*False):?)|$)/gis;
  const trueFalsePattern = /(\d+)\.\s*(?:True\/False:|True\s*\/\s*False:)\s*(.*?)(?=(?:\d+\.\s*(?:MCQ|Multiple\s*Choice|Short\s*Answer|Essay|True\/False|True\s*\/\s*False):?)|$)/gis;
  
  // If no type-specific patterns, try a generic pattern
  const genericPattern = /(\d+)\.\s*(.*?)(?=(?:\d+\.)|$)/gis;

  const questions: ParsedQuestion[] = [];
  let match;

  // Helper function to extract options for MCQs
  const extractOptions = (text: string): string[] => {
    const options = [];
    // Match options formatted as A) or A. followed by text
    const optionPattern = /([A-D])[).]\s*([^\n]+)(?:\n|$)/g;
    let optionMatch;
    
    while ((optionMatch = optionPattern.exec(text)) !== null) {
      options.push(`${optionMatch[1]}) ${optionMatch[2].trim()}`);
    }
    
    return options;
  };

  // Helper function to extract the correct answer
  const extractAnswer = (text: string, type: string): string | null => {
    if (type === 'mcq') {
      const answerMatch = text.match(/Answer:\s*([A-D])/i);
      return answerMatch ? answerMatch[1] : null;
    } else if (type === 'trueFalse') {
      const answerMatch = text.match(/Answer:\s*(True|False)/i);
      return answerMatch ? answerMatch[1] : null;
    }
    return null;
  };

  // Helper function to clean question text - improved to thoroughly remove answers
  const cleanQuestionText = (text: string, type: 'mcq' | 'shortAnswer' | 'essay' | 'trueFalse' | 'unknown'): string => {
    // Start with the original text
    let cleanText = text;
    
    // Remove options from MCQ questions
    if (type === 'mcq') {
      cleanText = cleanText.replace(/([A-D])[).]\s*([^\n]+)(?:\n|$)/g, '');
    }
    
    // Remove all types of Answer sections for all question types
    cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False).*?(?:\n|$)/gi, '');
    cleanText = cleanText.replace(/(?:Answer|Sample Answer|Suggested Answer|Expected Answer|Model Answer|Correct Answer):.*?(?:\n|$)/gis, '');
    
    // For short answer and essay, remove any suggested answers or answer content
    if (type === 'shortAnswer' || type === 'essay') {
      // Remove all sections that might contain answer content
      cleanText = cleanText.replace(/(?:Answer|Sample Answer|Suggested Answer|Expected Answer|Model Answer|Example Answer|Solution):[\s\S]*?(?=\n\n|\n$|$)/gis, '');
      
      // Remove content after "Word count:", "Word limit:" etc.
      cleanText = cleanText.replace(/(?:Word count|Word limit|Expected length|Character limit):.*?(?=\n\n|\n$|$)/gi, '');
      
      // Remove response guidelines
      cleanText = cleanText.replace(/(?:Guidelines|Response Guidelines|Answer Guidelines):.*?(?=\n\n|\n$|$)/gi, '');
    }
    
    // Remove any "Select one:" or similar instructions
    cleanText = cleanText.replace(/(?:Select one:|Choose one:|Select the correct option:).*?(?:\n|$)/gi, '');
    
    // Remove potential point values that might appear
    cleanText = cleanText.replace(/\(\s*\d+\s*points?\s*\)/gi, '');
    
    // Remove grading criteria if present
    cleanText = cleanText.replace(/(?:Grading criteria|Grading rubric|Marking scheme):.*?(?=\n\n|\n$|$)/gis, '');
    
    // Trim extra whitespace and newlines
    cleanText = cleanText.trim().replace(/\n{3,}/g, '\n\n');
    
    return cleanText;
  };

  // Process MCQs
  while ((match = mcqPattern.exec(examText)) !== null) {
    const id = parseInt(match[1]);
    const text = match[2].trim();
    const options = extractOptions(text);
    const correctAnswer = extractAnswer(text, 'mcq');
    const cleanText = cleanQuestionText(text, 'mcq');
    
    questions.push({
      id,
      text: cleanText,
      type: 'mcq',
      options,
      correctAnswer
    });
  }

  // Process Short Answer questions
  while ((match = shortAnswerPattern.exec(examText)) !== null) {
    const id = parseInt(match[1]);
    const text = match[2].trim();
    const cleanText = cleanQuestionText(text, 'shortAnswer');
    
    questions.push({
      id,
      text: cleanText,
      type: 'shortAnswer',
      options: [],
      correctAnswer: null
    });
  }

  // Process Essay questions
  while ((match = essayPattern.exec(examText)) !== null) {
    const id = parseInt(match[1]);
    const text = match[2].trim();
    const cleanText = cleanQuestionText(text, 'essay');
    
    questions.push({
      id,
      text: cleanText,
      type: 'essay',
      options: [],
      correctAnswer: null
    });
  }

  // Process True/False questions
  while ((match = trueFalsePattern.exec(examText)) !== null) {
    const id = parseInt(match[1]);
    const text = match[2].trim();
    const correctAnswer = extractAnswer(text, 'trueFalse');
    const cleanText = cleanQuestionText(text, 'trueFalse');
    
    questions.push({
      id,
      text: cleanText,
      type: 'trueFalse',
      options: ['True', 'False'],
      correctAnswer
    });
  }

  // If we didn't find any questions with the specific formats,
  // try parsing with a generic pattern
  if (questions.length === 0) {
    while ((match = genericPattern.exec(examText)) !== null) {
      const id = parseInt(match[1]);
      const text = match[2].trim();
      
      // Detect question type from content
      let type: 'mcq' | 'shortAnswer' | 'essay' | 'trueFalse' | 'unknown' = 'unknown'; // Default type with explicit typing
      let options: string[] = [];
      let correctAnswer: string | null = null;
      
      if (text.match(/Answer:\s*(True|False)/i)) {
        type = 'trueFalse';
        options = ['True', 'False'];
        const answerMatch = text.match(/Answer:\s*(True|False)/i);
        correctAnswer = answerMatch ? answerMatch[1] : null;
      } else if (text.match(/([A-D])[).]\s*([^\n]+)/g)) {
        type = 'mcq';
        options = extractOptions(text);
        const answerMatch = text.match(/Answer:\s*([A-D])/i);
        correctAnswer = answerMatch ? answerMatch[1] : null;
      } else if (text.toLowerCase().includes('essay') || text.toLowerCase().includes('write an essay')) {
        type = 'essay';
      } else {
        type = 'shortAnswer';
      }
      
      const cleanText = cleanQuestionText(text, type);
      
      questions.push({
        id,
        text: cleanText,
        type,
        options,
        correctAnswer
      });
    }
  }

  // Sort questions by ID
  return questions.sort((a, b) => a.id - b.id);
};

// Helper function to format exam with proper layout
export const formatExamWithLayout = (exam: any) => {
  const { name, date, time, duration, numberOfQuestions, topics, difficulty, questionTypes, questions } = exam;
  
  let examText = `# ${name}\n\n`;
  examText += `**Date:** ${date}\n`;
  examText += `**Time:** ${time}\n`;
  examText += `**Duration:** ${duration} minutes\n`;
  examText += `**Number of Questions:** ${numberOfQuestions}\n`;
  examText += `**Topics:** ${topics.join(', ')}\n`;
  examText += `**Difficulty:** ${difficulty}\n`;
  examText += `**Question Types:** ${questionTypes}\n\n`;
  
  if (typeof questions === 'string') {
    examText += questions;
  } else if (Array.isArray(questions)) {
    questions.forEach((question, index) => {
      examText += `${index + 1}. ${question.text}\n`;
      if (question.options && question.options.length > 0) {
        question.options.forEach(option => {
          examText += `  - ${option}\n`;
        });
      }
      examText += '\n';
    });
  }
  
  return examText;
};
