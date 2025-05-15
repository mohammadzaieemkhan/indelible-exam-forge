
import React, { useRef } from 'react';
import ExamCard from './ExamCard';
import { IExam } from '@/components/ExamTabs';
import ExamHandwrittenUploadHandler from './ExamHandwrittenUploadHandler';
import ExamRendererWithHandwritten from './ExamRendererWithHandwritten';
import { toast } from '@/hooks/use-toast';

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
      // Call the function directly 
      renderer.handleViewExam();
    }
  };
  
  // Handle sending reminder
  const handleSendReminder = () => {
    toast({
      title: "Reminder Set",
      description: `You'll be reminded about "${props.exam.name}" exam on ${props.exam.date}.`,
      duration: 3000,
    });
  };
  
  return (
    <>
      <ExamCard 
        exam={props.exam}
        onSendReminder={handleSendReminder}
        onDeleteClick={() => props.onDeleteClick?.()} 
        onViewExam={handleView}
      />
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </>
  );
};

export default ExamCardWithHandwritten;
