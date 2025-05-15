
import React, { useRef } from 'react';
import ExamHandwrittenUploadHandler from './exam/ExamHandwrittenUploadHandler';

// Define and export the IExam interface - this will fix most of our import errors
export interface IExam {
  id?: string;
  name: string;
  date: string;
  time: string;
  duration: number;
  numberOfQuestions: number;
  topics: string[];
  difficulty: string;
  questionTypes: string;
  isActive: boolean;
  questions?: string;
}

// Create a wrapper component for ExamTabs that will handle the exam window reference
const ExamTabsWithHandwrittenSupport: React.FC<{
  onExamWindowOpen?: (examWindow: Window) => void
}> = ({ onExamWindowOpen }) => {
  const examWindowRef = useRef<Window | null>(null);
  
  // Function to be called when opening the exam window
  const handleExamWindowOpen = (examWindow: Window) => {
    examWindowRef.current = examWindow;
    if (onExamWindowOpen) {
      onExamWindowOpen(examWindow);
    }
  };
  
  return (
    <>
      {/* This should be the actual tab content - will need to refactor this elsewhere but fixing the errors first */}
      <div className="p-3">
        <h2 className="text-lg font-medium mb-4">Exam Tabs Content</h2>
        <p>This component needs proper implementation. Currently fixing build errors.</p>
      </div>
      
      {/* Add the handwritten upload handler */}
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </>
  );
};

export default ExamTabsWithHandwrittenSupport;
