
import { formatExamWithLayout } from "./utils/examParser";

// This function will be used instead of the original ExamRenderer
// when we want the two-panel layout
export const renderExamWithNumbersPanel = (exam) => {
  const examHtml = formatExamWithLayout(exam);
  
  // This function mimics what handleViewExam does but uses our enhanced renderer
  const openExamWindow = () => {
    const examWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');
    
    if (!examWindow) {
      console.error("Popup blocked");
      return false;
    }
    
    // Add a script to pass exam completion data back to the parent window
    const completionScript = `
      <script>
        function submitExam(examData) {
          // Store the data in localStorage as backup
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          localStorage.setItem('completedExamId', examData.examId);
          
          // Try to send message to parent window
          try {
            window.opener.postMessage({
              type: 'examCompleted',
              examData: examData
            }, '*');
            console.log('Sent exam completion data to parent window');
          } catch (error) {
            console.error('Failed to send message to parent window:', error);
          }
        }
      </script>
    `;
    
    // Write content to the new window with the completion script
    examWindow.document.open();
    examWindow.document.write(completionScript + examHtml);
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
