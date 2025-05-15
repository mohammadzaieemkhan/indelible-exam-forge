
import React from "react";
import { ParsedQuestionItem, parseQuestions } from "./utils/examParser";
import { IExam } from "@/components/ExamTabs";
import { toast } from "@/components/ui/use-toast";
import { generateExamHtml } from "./ExamRenderer"; // Reuse the HTML generator

interface ExamRendererWithHandwrittenProps {
  exam: IExam;
  onExamWindowOpen?: (window: Window) => void;
}

const ExamRendererWithHandwritten = ({ exam, onExamWindowOpen }: ExamRendererWithHandwrittenProps) => {
  // Open exam in a new window
  const handleViewExam = () => {
    if (!exam.isActive) {
      toast({
        title: "Exam Not Available",
        description: "This exam is not yet available to take.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new window for the exam
    const examWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');
    
    if (!examWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to take the exam.",
        variant: "destructive"
      });
      return;
    }
    
    // Call the callback to store the exam window reference
    if (onExamWindowOpen) {
      onExamWindowOpen(examWindow);
    }
    
    // Generate the HTML content for the exam window
    const parsedQuestions = parseQuestions(exam.questions || "");
    
    // Generate HTML content for exam
    const examContent = generateExamHtml(exam, parsedQuestions);
    
    // Write the content to the new window
    examWindow.document.open();
    examWindow.document.write(examContent);
    examWindow.document.close();
  };

  // Return an object with the function instead of rendering a component
  return {
    handleViewExam,
  };
};

export { parseQuestions };
export default ExamRendererWithHandwritten;
