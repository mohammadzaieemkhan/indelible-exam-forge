import React, { useRef } from 'react';
import ExamHandwrittenUploadHandler from './exam/ExamHandwrittenUploadHandler';

// Create a wrapper component for ExamTabs that will handle the exam window reference
const ExamTabsWithHandwrittenSupport: React.FC = () => {
  const examWindowRef = useRef<Window | null>(null);
  
  // Function to be called when opening the exam window
  const handleExamWindowOpen = (examWindow: Window) => {
    examWindowRef.current = examWindow;
  };
  
  return (
    <>
      {/* Pass the original ExamTabs component with a ref to capture the exam window */}
      <ExamTabsOriginal onExamWindowOpen={handleExamWindowOpen} />
      
      {/* Add the handwritten upload handler */}
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </>
  );
};

export default ExamTabsWithHandwrittenSupport;
