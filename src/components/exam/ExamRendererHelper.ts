import { formatExamWithLayout } from "./utils/examParser";
import { ParsedQuestion, ExamSubmissionData } from "./types/examTypes";

// This function will be used instead of the original ExamRenderer
// when we want the two-panel layout
export const renderExamWithNumbersPanel = (exam) => {
  // Create a version of the exam without answers for display
  const examWithoutAnswers = { ...exam };
  
  // If questions have answers, remove them from what's shown to students
  if (examWithoutAnswers.questions) {
    const questionsWithoutAnswers = examWithoutAnswers.questions.map(question => {
      // Create a clean version of the question without the answer part
      let cleanText = question.text;
      if (question.correctAnswer) {
        cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False|.*)/i, '');
      }
      
      return {
        ...question,
        text: cleanText,
        // Remove correctAnswer from what's displayed to students
        correctAnswer: undefined
      };
    });
    
    examWithoutAnswers.questions = questionsWithoutAnswers;
  }
  
  const examHtml = formatExamWithLayout(examWithoutAnswers);
  
  // Keep original answers for evaluation
  const originalQuestions = exam.questions;
  
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
          console.log("Submitting exam data:", examData);
          
          // Store the data in localStorage as backup
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          localStorage.setItem('completedExamId', examData.examId);
          
          // Add a div for showing submission results
          if (!document.getElementById('submission-result')) {
            const resultDiv = document.createElement('div');
            resultDiv.id = 'submission-result';
            resultDiv.style.position = 'fixed';
            resultDiv.style.top = '50%';
            resultDiv.style.left = '50%';
            resultDiv.style.transform = 'translate(-50%, -50%)';
            resultDiv.style.padding = '20px';
            resultDiv.style.borderRadius = '8px';
            resultDiv.style.backgroundColor = 'white';
            resultDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            resultDiv.style.zIndex = '999';
            resultDiv.style.display = 'none';
            document.body.appendChild(resultDiv);
          }
          
          // Try to send message to parent window
          try {
            window.opener.postMessage({
              type: 'examCompleted',
              examData: examData
            }, '*');
            console.log('Sent exam completion data to parent window');
            
            // Show a success message to the user
            const resultEl = document.getElementById('submission-result');
            if (resultEl) {
              resultEl.innerHTML = '<div class="alert success" style="color: #155724; background-color: #d4edda; padding: 15px; border-radius: 4px;">Exam submitted successfully! Your exam is being evaluated, and results will be available in the Performance tab.</div>';
              resultEl.style.display = 'block';
            }

            // Close window after a short delay
            setTimeout(() => {
              window.close();
            }, 3000);
          } catch (error) {
            console.error('Failed to send message to parent window:', error);
            
            // Show an error message but note that results are still saved
            const resultEl = document.getElementById('submission-result');
            if (resultEl) {
              resultEl.innerHTML = '<div class="alert warning" style="color: #856404; background-color: #fff3cd; padding: 15px; border-radius: 4px;">Connection issue, but your results are saved. You can close this window.</div>';
              resultEl.style.display = 'block';
            }
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
