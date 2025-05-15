
import React from "react";
import { ParsedQuestionItem, parseQuestions, markdownToHtml } from "./utils/examParser";
import { IExam } from "@/components/ExamTabs";
import { useToast } from "@/hooks/use-toast";
import { extractTextFromImage } from "@/utils/ocrUtils";

interface ExamRendererProps {
  exam: IExam;
}

// Function to render different question types as HTML
export const renderQuestionHtml = (question: ParsedQuestionItem, index: number) => {
  const questionId = `question-${index}`;
  
  switch (question.type) {
    case 'mcq':
      return `
        <div class="options">
          ${question.options?.map((option, optIndex) => `
            <div class="option">
              <label class="option-label" for="${questionId}-option-${optIndex}">
                <input 
                  type="radio" 
                  name="${questionId}" 
                  id="${questionId}-option-${optIndex}" 
                  value="${optIndex}"
                  class="radio-input"
                  onchange="selectOption(${index}, ${optIndex})"
                />
                <span class="radio-custom"></span>
                <div class="option-text">${option}</div>
              </label>
            </div>
          `).join('') || ''}
        </div>
      `;
    case 'truefalse':
      return `
        <div class="options">
          <div class="option">
            <label class="option-label" for="${questionId}-true">
              <input 
                type="radio" 
                name="${questionId}" 
                id="${questionId}-true" 
                value="true"
                class="radio-input"
                onchange="selectOption(${index}, 0)"
              />
              <span class="radio-custom"></span>
              <div class="option-text">True</div>
            </label>
          </div>
          <div class="option">
            <label class="option-label" for="${questionId}-false">
              <input 
                type="radio" 
                name="${questionId}" 
                id="${questionId}-false" 
                value="false"
                class="radio-input"
                onchange="selectOption(${index}, 1)"
              />
              <span class="radio-custom"></span>
              <div class="option-text">False</div>
            </label>
          </div>
        </div>
      `;
    case 'shortanswer':
      return `
        <div class="text-input-container">
          <input type="text" class="text-input" id="answer-${index}" 
            placeholder="Enter your short answer here..." 
            onchange="saveAnswer(${index}, this.value)" />
          <div class="mt-2">
            <button
              type="button" 
              class="upload-image-button"
              data-question-id="${index}"
              data-question-type="shortanswer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
              Upload from Photo
            </button>
          </div>
        </div>
      `;
    case 'essay':
      return `
        <div class="textarea-container">
          <textarea class="essay-input" id="answer-${index}" 
            placeholder="Write your essay here..."
            onchange="saveAnswer(${index}, this.value)"></textarea>
          <div class="mt-2">
            <button
              type="button" 
              class="upload-image-button"
              data-question-id="${index}"
              data-question-type="essay"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
              Upload from Photo
            </button>
          </div>
        </div>
      `;
    default:
      return `<p class="text-muted">Unsupported question type</p>`;
  }
};

// Generate HTML content for the exam window
export const generateExamHtml = (exam: IExam, questions: ParsedQuestionItem[]) => {
  console.log("Generating exam HTML with questions:", questions);
  
  // If we don't have any questions, show error message
  if (!questions || questions.length === 0) {
    console.error("No questions available to generate exam");
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - ${exam.name}</title>
        <style>
          body { font-family: sans-serif; padding: 30px; text-align: center; }
          .error-container { max-width: 600px; margin: 100px auto; }
          h1 { color: #ef4444; }
          pre { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: left; overflow: auto; }
        </style>
      </head>
      <body>
        <div class="error-container">
          <h1>Error Loading Exam Questions</h1>
          <p>We couldn't parse any questions for this exam. This might be because:</p>
          <ul style="text-align: left; display: inline-block;">
            <li>The question format is not recognized</li>
            <li>The exam questions were not generated properly</li>
            <li>There's an issue with the question data</li>
          </ul>
          <p>Please go back and try regenerating the exam, or contact support if the issue persists.</p>
          
          <h3>Raw Question Content:</h3>
          <pre>${exam.questions ? exam.questions.substring(0, 1000) + (exam.questions.length > 1000 ? '...' : '') : 'No question content available'}</pre>
          
          <button onclick="window.close()" style="padding: 10px 20px; margin-top: 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Close Window</button>
        </div>
      </body>
      </html>
    `;
  }

  // Create a simpler exam UI with all questions displayed on a single page
  const questionsHtml = questions.map((question, index) => {
    return `
      <div class="question-box" id="question-${index}">
        <div class="question-header">
          <h3>Question ${index + 1}</h3>
        </div>
        <div class="question-content">
          ${markdownToHtml(question.question)}
        </div>
        <div class="answer-section">
          ${renderQuestionHtml(question, index)}
        </div>
        <hr class="question-divider" />
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${exam.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
          margin: 0;
          padding: 20px;
        }
        
        .exam-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .exam-title {
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        
        .exam-info {
          color: #64748b;
          font-size: 14px;
        }
        
        .timer {
          background-color: #f1f5f9;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          margin-bottom: 20px;
          font-weight: bold;
        }
        
        .question-box {
          background-color: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .question-header {
          margin-bottom: 15px;
        }
        
        .question-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .question-content {
          margin-bottom: 20px;
        }
        
        .question-divider {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 20px 0 10px 0;
        }
        
        .options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .option-label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: all 0.2s ease;
        }
        
        .option-label:hover {
          border-color: #cbd5e1;
          background-color: #f8fafc;
        }
        
        .radio-input {
          position: absolute;
          opacity: 0;
        }
        
        .radio-custom {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 10px;
          border: 2px solid #cbd5e1;
          border-radius: 50%;
          position: relative;
          flex-shrink: 0;
          margin-top: 2px;
        }
        
        .radio-input:checked + .radio-custom::after {
          content: "";
          position: absolute;
          width: 12px;
          height: 12px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background-color: #2563eb;
        }
        
        .option-text {
          flex: 1;
        }
        
        .text-input {
          width: 100%;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: border-color 0.2s ease;
        }
        
        .text-input:focus {
          outline: none;
          border-color: #2563eb;
        }
        
        .essay-input {
          width: 100%;
          min-height: 150px;
          padding: 15px;
          font-size: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          transition: border-color 0.2s ease;
          resize: vertical;
          font-family: inherit;
        }
        
        .essay-input:focus {
          outline: none;
          border-color: #2563eb;
        }
        
        .upload-image-button {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          background-color: #f8f9fa;
          color: #333;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-image-button:hover {
          background-color: #f1f5f9;
        }
        
        .exam-footer {
          display: flex;
          justify-content: center;
          margin-top: 30px;
          margin-bottom: 50px;
        }
        
        .button {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .button.primary {
          background-color: #2563eb;
          color: white;
        }
        
        .button.primary:hover {
          background-color: #1d4ed8;
        }
        
        #image-upload-input {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="exam-header">
        <h1 class="exam-title">${exam.name}</h1>
        <p class="exam-info">${exam.date} • ${exam.duration} minutes</p>
        <div class="timer" id="exam-timer">
          <span id="timer-value">00:00:00</span>
        </div>
      </div>
      
      <div class="exam-content">
        ${questionsHtml}
      </div>
      
      <div class="exam-footer">
        <button class="button primary" id="submit-button" onclick="submitExam()">Submit Exam</button>
      </div>
      
      <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
      
      <script>
        let currentUploadQuestionId = null;
        let isProcessingImage = false;
        let answeredQuestions = {};
        let examStartTime = new Date();
        let examTimerInterval;
        let examDuration = ${exam.duration || 60}; // Default to 60 minutes if not specified
        
        // Set up image upload buttons
        document.addEventListener('DOMContentLoaded', () => {
          // Initialize exam
          initExam();
          
          // Add click handlers for all upload image buttons
          document.querySelectorAll('.upload-image-button').forEach(button => {
            button.addEventListener('click', () => {
              if (isProcessingImage) return;
              
              // Store the question ID for the current upload
              currentUploadQuestionId = button.dataset.questionId;
              
              // Trigger file input click
              document.getElementById('image-upload-input').click();
            });
          });
          
          // Handle file selection
          document.getElementById('image-upload-input').addEventListener('change', handleImageUpload);
        });
        
        // Initialize exam
        function initExam() {
          // Start timer
          examStartTime = new Date();
          examTimerInterval = setInterval(updateTimer, 1000);
          
          // Set auto-submit timer
          if (examDuration > 0) {
            setTimeout(() => {
              // Auto-submit when time is up
              submitExam(true);
            }, examDuration * 60 * 1000);
          }
        }
        
        // Update the timer display
        function updateTimer() {
          const now = new Date();
          const elapsedMs = now - examStartTime;
          const durationMs = examDuration * 60 * 1000;
          const remainingMs = Math.max(0, durationMs - elapsedMs);
          
          // Format for display (show remaining time)
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
          
          const formattedTime = 
            String(hours).padStart(2, '0') + ':' +
            String(minutes).padStart(2, '0') + ':' +
            String(seconds).padStart(2, '0');
          
          document.getElementById('timer-value').textContent = formattedTime;
          
          // Show warning when less than 5 minutes remaining
          if (remainingMs < 300000) {
            document.getElementById('exam-timer').style.backgroundColor = '#fee2e2';
            document.getElementById('exam-timer').style.color = '#dc2626';
          }
        }
        
        // Save answer for multiple choice questions
        function selectOption(questionIndex, optionIndex) {
          answeredQuestions[questionIndex] = optionIndex;
        }
        
        // Save answer for text/essay questions
        function saveAnswer(questionIndex, answer) {
          if (answer && answer.trim() !== '') {
            answeredQuestions[questionIndex] = answer;
          } else {
            delete answeredQuestions[questionIndex];
          }
        }
        
        // Submit the exam
        function submitExam(isAutoSubmit = false) {
          const totalQuestions = ${questions.length};
          const answeredCount = Object.keys(answeredQuestions).length;
          
          if (!isAutoSubmit && answeredCount < totalQuestions) {
            const confirmSubmit = confirm(\`You've only answered \${answeredCount} out of \${totalQuestions} questions. Are you sure you want to submit?\`);
            if (!confirmSubmit) return;
          }
          
          if (isAutoSubmit) {
            alert('Time is up! Your exam will be submitted automatically.');
          }
          
          // Stop the timer
          clearInterval(examTimerInterval);
          
          // Calculate time taken
          const endTime = new Date();
          const timeTakenMs = endTime - examStartTime;
          const minutes = Math.floor(timeTakenMs / 60000);
          const seconds = Math.floor((timeTakenMs % 60000) / 1000);
          const timeTaken = \`\${minutes} minute\${minutes !== 1 ? 's' : ''} and \${seconds} second\${seconds !== 1 ? 's' : ''}\`;
          
          // Collect all answers
          const answers = answeredQuestions;
          
          // Prepare exam data to send back
          const examData = {
            type: 'examCompleted',
            examId: '${exam.id || ''}',
            examName: '${exam.name}',
            date: '${exam.date}',
            answers: answers,
            timeTaken: timeTaken,
            questionTypes: ${JSON.stringify(questions.map(q => q.type))},
            questionWeights: ${JSON.stringify(exam.questionWeights || {})},
            questions: ${JSON.stringify(questions.map(q => ({
              question: q.question,
              type: q.type,
              options: q.options,
              answer: q.answer
            })))}
          };
          
          console.log("Submitting exam data:", examData);
          
          // Create summary page
          document.body.innerHTML = \`
            <div style="max-width: 600px; margin: 100px auto; text-align: center;">
              <h1>Exam Submitted</h1>
              <p>Your answers have been recorded.</p>
              <p>You answered \${answeredCount} out of \${totalQuestions} questions.</p>
              <p>Time taken: \${timeTaken}</p>
              <button onclick="window.close()" style="padding: 10px 20px; margin-top: 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Close Exam
              </button>
            </div>
          \`;
          
          // Try to send answers to parent window if available
          try {
            window.opener.postMessage(examData, '*');
            console.log("Sent exam data to parent window");
            
            // As fallback, also save in localStorage
            localStorage.setItem('completedExamId', '${exam.id || ''}');
            localStorage.setItem('lastExamResults', JSON.stringify(examData));
            console.log("Saved exam results to localStorage");
          } catch (e) {
            console.error('Could not send results to parent window:', e);
            
            // Fallback to localStorage
            localStorage.setItem('completedExamId', '${exam.id || ''}');
            localStorage.setItem('lastExamResults', JSON.stringify(examData));
            console.log("Saved exam results to localStorage as fallback");
          }
        }
        
        // Handle image upload and text extraction
        async function handleImageUpload(event) {
          const file = event.target.files[0];
          if (!file || !currentUploadQuestionId) return;
          
          // Check if file is an image
          if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
          }
          
          try {
            // Show loading state
            isProcessingImage = true;
            const buttons = document.querySelectorAll('.upload-image-button');
            buttons.forEach(btn => {
              btn.textContent = "Processing image...";
              btn.disabled = true;
            });
            
            // Convert image to base64
            const base64 = await fileToBase64(file);
            
            // Call parent window to extract text
            window.opener.postMessage({
              type: 'extractText',
              imageBase64: base64,
              questionId: currentUploadQuestionId
            }, "*");
            
            // Listen for response from parent
            window.addEventListener('message', function textResponseHandler(e) {
              if (e.data.type === 'textExtracted' && e.data.questionId === currentUploadQuestionId) {
                // Set the extracted text to the answer field
                const questionId = parseInt(currentUploadQuestionId);
                const questionType = document.querySelector(\`[data-question-id="\${questionId}"]\`).dataset.questionType;
                
                if (questionType === 'essay') {
                  document.getElementById(\`answer-\${questionId}\`).value = e.data.text;
                } else {
                  document.getElementById(\`answer-\${questionId}\`).value = e.data.text;
                }
                
                // Save the answer
                saveAnswer(questionId, e.data.text);
                
                // Reset loading state
                isProcessingImage = false;
                
                // Reset buttons
                buttons.forEach(btn => {
                  btn.innerHTML = \`
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                    Upload from Photo
                  \`;
                  btn.disabled = false;
                });
                
                // Remove this event listener
                window.removeEventListener('message', textResponseHandler);
                
                // Clear the input value to allow selecting the same file again
                event.target.value = '';
              }
            });
          } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image: ' + (error.message || 'Unknown error'));
            
            // Reset loading state
            isProcessingImage = false;
            const buttons = document.querySelectorAll('.upload-image-button');
            buttons.forEach(btn => {
              btn.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
                Upload from Photo
              \`;
              btn.disabled = false;
            });
            
            // Clear the input value
            event.target.value = '';
          }
        }
        
        // Utility function to convert file to base64
        function fileToBase64(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                // Remove data URL prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
              } else {
                reject(new Error('Failed to convert file to base64'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
      </script>
    </body>
    </html>
  `;
};

const ExamRenderer = ({ exam }: ExamRendererProps) => {
  const { toast } = useToast();

  // Handle text extraction request from the exam iframe
  React.useEffect(() => {
    const handleExamMessage = async (event: MessageEvent) => {
      // Process extract text request
      if (event.data?.type === 'extractText') {
        try {
          console.log("Received text extraction request from exam iframe");
          const { imageBase64, questionId } = event.data;
          
          // Call the OCR service
          const result = await extractTextFromImage(imageBase64);
          
          if (result.success && result.text) {
            // Send the extracted text back to the iframe
            const examIframe = document.querySelector('iframe') as HTMLIFrameElement;
            
            if (examIframe && examIframe.contentWindow) {
              examIframe.contentWindow.postMessage({
                type: 'textExtracted',
                text: result.text,
                questionId: questionId
              }, '*');
            }
            
            toast({
              title: "Text Extracted",
              description: "Text has been extracted from the image and added to your answer"
            });
          } else {
            throw new Error(result.error || 'Failed to extract text');
          }
        } catch (error) {
          console.error("Error in OCR process:", error);
          toast({
            title: "Text Extraction Failed",
            description: error.message || "Failed to extract text from image",
            variant: "destructive"
          });
        }
      }
      
      // Listen for exam completion
      if (event.data?.type === 'examCompleted') {
        console.log("Received exam completion data:", event.data);
        
        // Try to send it to the parent window for processing
        try {
          window.postMessage({
            type: 'examCompleted',
            examData: event.data
          }, '*');
          
          toast({
            title: "Exam Submitted",
            description: "Your exam has been submitted and will be evaluated"
          });
        } catch (error) {
          console.error("Error handling exam completion:", error);
          toast({
            title: "Submission Error",
            description: "There was an error submitting your exam. Please try again.",
            variant: "destructive"
          });
        }
      }
    };
    
    window.addEventListener('message', handleExamMessage);
    return () => window.removeEventListener('message', handleExamMessage);
  }, [toast]);

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
    
    // Generate the HTML content for the exam window
    console.log("Generating exam with questions content:", exam.questions);
    const parsedQuestions = parseQuestions(exam.questions || "");
    console.log("Parsed questions:", parsedQuestions);
    
    // Generate HTML content for exam with simplified UI
    const examContent = generateExamHtml(exam, parsedQuestions);
    
    // Write the content to the new window
    examWindow.document.open();
    examWindow.document.write(examContent);
    examWindow.document.close();
  };

  return null; // This component doesn't render anything directly
};

// Export named functions and the default component
export { parseQuestions };
export default ExamRenderer;
