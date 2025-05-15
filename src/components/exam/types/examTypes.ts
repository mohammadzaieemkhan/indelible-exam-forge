
// Define shared types for exam components
export interface ParsedQuestion {
  id: number;
  text: string;
  type: 'mcq' | 'shortAnswer' | 'essay' | 'trueFalse' | 'unknown';
  options?: string[];
  correctAnswer?: string;
  weight?: number;
}

export interface ExamAnswer {
  questionId: string;
  value: string;
  type: string;
}

export interface ExamSubmissionData {
  examId: string;
  examName: string;
  date: string;
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    answer?: string;
  }>;
  answers: Record<string, string>;
  timeTaken: string;
  questionTypes: Array<string>;
  questionWeights: Record<number, number>;
  percentage?: number; // Added to ensure this property is available for display
  score?: number; // Added to track raw score
  totalMarks?: number; // Added to track total possible marks
}
