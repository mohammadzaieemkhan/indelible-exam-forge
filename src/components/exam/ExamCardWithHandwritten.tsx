
import React, { useRef, useEffect, useState } from 'react';
import ExamCard from './ExamCard';
import { IExam } from '@/components/ExamTabs';
import ExamHandwrittenUploadHandler from './ExamHandwrittenUploadHandler';
import ExamRendererWithHandwritten from './ExamRendererWithHandwritten';
import { toast } from '@/components/ui/use-toast';

interface ExamCardWithHandwrittenProps {
  exam: IExam;
  onDeleteClick?: () => void;
  onEditClick?: () => void;
  onDuplicateClick?: () => void;
  onView?: () => void;
}

const ExamCardWithHandwritten: React.FC<ExamCardWithHandwrittenProps> = (props) => {
  const examWindowRef = useRef<Window | null>(null);
  // State to track if the exam is currently available
  const [isExamAvailable, setIsExamAvailable] = useState(false);
  
  // Check if the exam should be available based on current time
  useEffect(() => {
    const checkExamAvailability = () => {
      const now = new Date();
      const [year, month, day] = props.exam.date.split('-').map(Number);
      
      // Parse the exam time
      let [hours, minutes] = [0, 0];
      if (props.exam.time) {
        [hours, minutes] = props.exam.time.split(':').map(Number);
      }
      
      const examDate = new Date(year, month - 1, day, hours, minutes);
      
      // The exam is available if the current time is past the scheduled exam time
      const available = now >= examDate || props.exam.isActive;
      setIsExamAvailable(available);
    };
    
    // Check availability immediately
    checkExamAvailability();
    
    // Set up interval to check periodically (every minute)
    const intervalId = setInterval(checkExamAvailability, 60000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [props.exam.date, props.exam.time, props.exam.isActive]);
  
  const handleExamWindowOpen = (examWindow: Window) => {
    examWindowRef.current = examWindow;
  };
  
  // Custom view handler that uses our ExamRendererWithHandwritten
  const handleView = () => {
    // Create the renderer instance without using 'new'
    const renderer = ExamRendererWithHandwritten({
      exam: {...props.exam, isActive: isExamAvailable},
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
        exam={{...props.exam, isActive: isExamAvailable}}
        onSendReminder={handleSendReminder}
        onDeleteClick={props.onDeleteClick ? () => props.onDeleteClick?.() : undefined}
        onViewExam={handleView}
      />
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </>
  );
};

export default ExamCardWithHandwritten;
