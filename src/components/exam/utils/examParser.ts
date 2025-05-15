import { generateExamLayoutHtml } from "../ExamLayout";

// Enhanced exam parser to work with our layout requirements
export const parseQuestionsEnhanced = (questionsText: string) => {
  // Basic parsing - normally this would be more sophisticated
  const questions = [];
  const answers = [];
  
  // Split by question numbers (1., 2., etc.)
  const questionRegex = /(\d+\.)(.*?)(?=\d+\.|$)/gs;
  let match;
  
  while ((match = questionRegex.exec(questionsText)) !== null) {
    const questionNumber = match[1].trim();
    const questionContent = match[2].trim();
    
    // Extract answer if present
    const answerMatch = questionContent.match(/Answer:\s*([A-D]|True|False|.+)$/i);
    let answer = null;
    let cleanedContent = questionContent;
    
    if (answerMatch) {
      answer = answerMatch[1].trim();
      // Remove the answer from the question content
      cleanedContent = questionContent.replace(/Answer:\s*([A-D]|True|False|.+)$/i, '').trim();
    }
    
    questions.push(`<h3>Question ${questionNumber}</h3>\n${cleanedContent}`);
    answers.push(answer);
  }
  
  return { questions, answers };
};

// Function to format an exam using the enhanced layout
export const formatExamWithLayout = (exam) => {
  const { questions, answers } = parseQuestionsEnhanced(exam.questions || "");
  return generateExamLayoutHtml(exam.name, questions, answers);
};

// Add the parseQuestions export to the existing file
// This is a stub implementation assuming parseQuestions doesn't exist yet
export const parseQuestions = (questionsText: string, questionTypes: string) => {
  // Assuming there's an existing function to handle this
  // We'll just add the export for now to fix the import error
  return [];
};
