
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
