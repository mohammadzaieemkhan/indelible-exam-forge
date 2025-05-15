
import { formatExamWithLayout, parseQuestions } from "./utils/examParser";
import { IExam } from '@/components/ExamTabs';
import { generateExamHtml } from './ExamRenderer';

// This function will be used instead of the original ExamRenderer
// when we want the two-panel layout
export const renderExamWithNumbersPanel = (exam: IExam) => {
  // Parse questions from the exam content
  const questions = parseQuestions(exam.questions || '');
  
  // Generate the HTML for the exam with our enhanced layout
  const examHtml = generateExamHtml(exam, questions);
  
  // This function mimics what handleViewExam does but uses our enhanced renderer
  const openExamWindow = () => {
    const examWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');
    
    if (!examWindow) {
      console.error("Popup blocked");
      return false;
    }
    
    // Write content to the new window
    examWindow.document.open();
    examWindow.document.write(examHtml);
    examWindow.document.close();
    
    // Request fullscreen after a short delay
    setTimeout(() => {
      try {
        const examElement = examWindow.document.getElementById('exam-container');
        if (examElement && examElement.requestFullscreen) {
          examElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        }
      } catch (error) {
        console.error("Could not enter fullscreen mode:", error);
      }
    }, 1000);
    
    return true;
  };
  
  return { openExamWindow };
};
