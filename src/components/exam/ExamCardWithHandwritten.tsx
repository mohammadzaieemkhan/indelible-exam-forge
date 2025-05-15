
import React, { useRef } from 'react';
import ExamCard from './ExamCard';
import { IExam } from '@/components/ExamTabs';
import ExamHandwrittenUploadHandler from './ExamHandwrittenUploadHandler';
import ExamRendererWithHandwritten from './ExamRendererWithHandwritten';

interface ExamCardWithHandwrittenProps {
  exam: IExam;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  onDuplicateClick?: () => void;
  onView?: () => void;
}

const ExamCardWithHandwritten: React.FC<ExamCardWithHandwrittenProps> = (props) => {
  const examWindowRef = useRef<Window | null>(null);
  
  const handleExamWindowOpen = (examWindow: Window) => {
    examWindowRef.current = examWindow;
  };
  
  // Custom view handler that uses our ExamRendererWithHandwritten
  const handleView = () => {
    // Create the renderer instance without using 'new'
    const renderer = ExamRendererWithHandwritten({
      exam: props.exam,
      onExamWindowOpen: handleExamWindowOpen
    });
    
    // If onView is provided, use it, otherwise use the renderer's handleViewExam
    if (props.onView) {
      props.onView();
    } else {
      // Call the function directly instead of using new keyword
      renderer.handleViewExam();
    }
  };
  
  return (
    <>
      <ExamCard 
        exam={props.exam}
        onDeleteClick={props.onDeleteClick}
        onEditClick={props.onEditClick}
        onDuplicateClick={props.onDuplicateClick}
        // We don't pass onView directly, as we handle it with our custom handler
      />
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </>
  );
};

export default ExamCardWithHandwritten;
