import React from "react";
import { ParsedQuestionItem, parseQuestions, markdownToHtml } from "./utils/examParser";
import { IExam } from "@/components/ExamTabs";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { extractTextFromImage, fileToBase64 } from "@/utils/ocrUtils";

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

  // Group questions by section
  const sectionMap: {[key: string]: ParsedQuestionItem[]} = {};
  
  questions.forEach(q => {
    const section = q.section || 'General';
    if (!sectionMap[section]) {
      sectionMap[section] = [];
    }
    sectionMap[section].push(q);
  });
  
  // Generate questions HTML grouped by sections
  const sectionsHtml = Object.keys(sectionMap).map((sectionName, sectionIndex) => {
    const sectionQuestions = sectionMap[sectionName];
    
    return `
      <div class="section-container" id="section-${sectionIndex}">
        <div class="section-header">
          <h2>${sectionName}</h2>
          <p>${sectionQuestions.length} question${sectionQuestions.length !== 1 ? 's' : ''}</p>
        </div>
        <div class="questions-container">
          ${sectionQuestions.map((q, qIndex) => {
            const globalIndex = questions.findIndex(question => question === q);
            return `
              <div class="question-container" id="question-${globalIndex}" ${globalIndex !== 0 ? 'style="display:none;"' : ''}>
                <div class="question-header">
                  <h3>Question ${qIndex + 1} - ${sectionName}</h3>
                </div>
                <div class="question-content">
                  ${markdownToHtml(q.question)}
                </div>
                <div class="answer-section">
                  ${renderQuestionHtml(q, globalIndex)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
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
        :root {
          --primary: #2563eb;
          --primary-hover: #1d4ed8;
          --primary-foreground: white;
          --border: #e2e8f0;
          --border-hover: #cbd5e1;
          --background: #ffffff;
          --muted: #f8fafc;
          --muted-foreground: #64748b;
          --accent: #f1f5f9;
          --accent-foreground: #0f172a;
          --destructive: #ef4444;
          --destructive-foreground: white;
        }
        
        /* General styles */
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: var(--accent-foreground);
          background-color: var(--background);
          margin: 0;
          padding: 0;
        }
        
        /* Styles for the upload button */
        .upload-image-button {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          background-color: var(--accent);
          color: var(--accent-foreground);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-image-button:hover {
          background-color: var(--muted);
        }
        
        .upload-image-button svg {
          margin-right: 6px;
        }
        
        .upload-image-button.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        #image-upload-input {
          display: none;
        }
        
      </style>
    </head>
    <body>
      <div id="exam-container">
        <div class="sidebar">
          <div class="sidebar-header">
            <h2>${exam.name}</h2>
            <p>${exam.date} • ${exam.duration} minutes</p>
          </div>
          
          <div class="sidebar-timer" id="exam-timer">
            <span id="timer-value">00:00:00</span>
          </div>
          
          <div class="sidebar-progress">
            <div>Progress</div>
            <div class="progress-bar">
              <div class="progress-value" id="progress-bar"></div>
            </div>
            <div class="progress-stats">
              <span id="progress-text">0 of ${questions.length} answered</span>
              <span id="progress-percentage">0%</span>
            </div>
          </div>
          
          <div class="question-grid" id="question-grid">
            ${questions.map((_, i) => `
              <div class="question-number${i === 0 ? ' current' : ''}" 
                id="question-button-${i}" 
                onclick="showQuestion(${i})">${i + 1}</div>
            `).join('')}
          </div>
          
          <div class="sidebar-legend">
            <div class="legend-title">Legend</div>
            <div class="legend-item">
              <div class="legend-color legend-current"></div>
              <span>Current Question</span>
            </div>
            <div class="legend-item">
              <div class="legend-color legend-answered"></div>
              <span>Answered</span>
            </div>
            <div class="legend-item">
              <div class="legend-color legend-review"></div>
              <span>Marked for Review</span>
            </div>
            <div class="legend-item">
              <div class="legend-color legend-unanswered"></div>
              <span>Unanswered</span>
            </div>
          </div>
          
          <div class="sidebar-actions">
            <button class="button" id="submit-button" onclick="submitExam()">Submit Exam</button>
          </div>
        </div>
        
        <div class="main-content">
          ${sectionsHtml}
          
          <div class="navigation">
            <button class="button secondary" id="prev-button" onclick="prevQuestion()">Previous</button>
            <button class="button review" id="review-button" onclick="markForReview()">Mark for Review</button>
            <button class="button secondary" id="next-button" onclick="nextQuestion()">Next</button>
          </div>
        </div>
      </div>
      
      <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
      
      <script>
        let currentUploadQuestionId = null;
        let isProcessingImage = false;
        
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
              btn.classList.add('loading');
              btn.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin mr-2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Extracting text...
              \`;
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
                  btn.classList.remove('loading');
                  btn.innerHTML = \`
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                    Upload from Photo
                  \`;
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
              btn.classList.remove('loading');
              btn.innerHTML = \`
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                  <circle cx="9" cy="9" r="2"></circle>
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                </svg>
                Upload from Photo
              \`;
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
          const result = await fetch('/api/extract-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64 })
          }).then(res => res.json());
          
          if (result.success && result.data?.text) {
            // Send the extracted text back to the iframe
            const examIframe = document.querySelector('iframe') as HTMLIFrameElement;
            
            if (examIframe && examIframe.contentWindow) {
              examIframe.contentWindow.postMessage({
                type: 'textExtracted',
                text: result.data.text,
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
    
    // Generate HTML content for exam with improved radio buttons for MCQs and true/false questions
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
