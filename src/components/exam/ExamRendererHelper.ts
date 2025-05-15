
import { formatExamWithLayout, parseQuestions } from "./utils/examParser";
import { IExam } from '@/components/ExamTabs';
import { generateExamHtml } from './ExamRenderer';

// This function will be used instead of the original ExamRenderer
// when we want the two-panel layout
export const renderExamWithNumbersPanel = (exam: IExam) => {
  // Check if exam has questions - guard against undefined
  if (!exam.questions) {
    // Create a basic fallback for exams without questions data
    const fallbackHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${exam.name || 'Exam'}</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 2rem; line-height: 1.5; }
          .error-container { max-width: 600px; margin: 0 auto; text-align: center; }
          h1 { color: #f43f5e; }
          .message { margin: 2rem 0; }
          button { background: #f43f5e; color: white; border: none; padding: 0.5rem 1rem; 
                  border-radius: 0.25rem; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Exam Content Unavailable</h1>
          <div class="message">
            <p>This exam doesn't have any questions data available.</p>
            <p>Please contact your instructor or try refreshing the page.</p>
          </div>
          <button onclick="window.close()">Close</button>
        </div>
      </body>
      </html>
    `;
    
    const openExamWindow = () => {
      const examWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');
      
      if (!examWindow) {
        console.error("Popup blocked");
        return false;
      }
      
      examWindow.document.open();
      examWindow.document.write(fallbackHtml);
      examWindow.document.close();
      return true;
    };
    
    return { openExamWindow };
  }
  
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
