
import React, { useState, useEffect } from "react";
import { IExam } from "@/components/ExamTabs";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExamSectionedRendererProps {
  exam: IExam;
  onExamWindowOpen?: (window: Window) => void;
}

const ExamSectionedRenderer = ({ exam, onExamWindowOpen }: ExamSectionedRendererProps) => {
  const [examWindow, setExamWindow] = useState<Window | null>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    return () => {
      // Close the exam window when the component unmounts
      if (examWindow && !examWindow.closed) {
        examWindow.close();
      }
    };
  }, [examWindow]);
  
  const handleViewExam = () => {
    // Close existing window if open
    if (examWindow && !examWindow.closed) {
      examWindow.close();
    }
    
    // Open a new window for the exam
    const width = isMobile ? window.innerWidth : Math.min(1200, window.innerWidth * 0.8);
    const height = isMobile ? window.innerHeight : Math.min(800, window.innerHeight * 0.8);
    
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    const newWindow = window.open(
      "",
      "examWindow",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
    
    if (newWindow) {
      // Set the window reference
      setExamWindow(newWindow);
      
      // Notify parent component about the new window
      if (onExamWindowOpen) {
        onExamWindowOpen(newWindow);
      }
      
      // Set up the exam content
      newWindow.document.title = `Exam: ${exam.name}`;
      
      // Style the exam window
      newWindow.document.body.style.margin = "0";
      newWindow.document.body.style.padding = "20px";
      newWindow.document.body.style.fontFamily = "'Inter', sans-serif";
      
      // Create the exam HTML structure
      const examContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Exam: ${exam.name}</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.5;
              color: #333;
              max-width: 1000px;
              margin: 0 auto;
              padding: 20px;
            }
            h1, h2, h3 { color: #1a365d; }
            .exam-header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .timer { 
              position: fixed; 
              top: 10px; 
              right: 10px; 
              background: #2563eb; 
              color: white; 
              padding: 8px 12px; 
              border-radius: 4px;
              font-weight: bold;
              z-index: 100;
            }
            .question { margin-bottom: 30px; }
            .options { list-style-type: none; padding-left: 0; }
            .options li { margin: 10px 0; }
            input[type="radio"], input[type="checkbox"] { margin-right: 10px; }
            textarea { width: 100%; min-height: 120px; padding: 10px; margin: 10px 0; }
            input[type="text"] { width: 100%; padding: 10px; margin: 10px 0; }
            button { 
              background: #2563eb; 
              color: white; 
              border: none; 
              padding: 10px 20px; 
              border-radius: 4px; 
              cursor: pointer;
              font-size: 16px;
            }
            button:hover { background: #1e40af; }
            .submit-container { 
              position: sticky; 
              bottom: 20px; 
              background: white; 
              padding: 15px;
              border-top: 1px solid #eee;
              text-align: center;
            }
            .answer-area img {
              max-width: 100%;
              height: auto;
            }
            .question-wrapper {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              background-color: #f9fafb;
            }
            .question-wrapper h3 {
              margin-top: 0;
            }
          </style>
        </head>
        <body>
          <div class="exam-header">
            <h1>${exam.name}</h1>
            <p><strong>Date:</strong> ${exam.date} ${exam.time || ''}</p>
            <p><strong>Duration:</strong> ${exam.duration} minutes</p>
            ${exam.topics && exam.topics.length > 0 ? 
              `<p><strong>Topics:</strong> ${exam.topics.join(', ')}</p>` : ''}
            ${exam.difficulty ? `<p><strong>Difficulty:</strong> ${exam.difficulty}</p>` : ''}
          </div>
          
          <div class="timer" id="exam-timer">${exam.duration}:00</div>
          
          <form id="examForm">
            <div id="questions-container">
              <!-- Questions will be inserted here by JavaScript -->
            </div>
            
            <div class="submit-container">
              <button type="submit" id="submitBtn">Submit Exam</button>
            </div>
          </form>

          <script>
            // Store exam data
            const examData = {
              id: "${exam.id || ''}",
              name: "${exam.name}",
              date: "${exam.date}",
              duration: ${exam.duration},
              startTime: new Date().toISOString(),
              questionResponses: []
            };
            
            // Parse questions from the parent window
            const questions = ${JSON.stringify(exam.questions || [])};
            
            // Render questions
            const renderQuestions = () => {
              const container = document.getElementById('questions-container');
              
              if (!questions || !Array.isArray(questions)) {
                container.innerHTML = '<div class="question"><p>No questions available for this exam.</p></div>';
                return;
              }
              
              questions.forEach((question, index) => {
                const questionNumber = index + 1;
                const questionElement = document.createElement('div');
                questionElement.className = 'question-wrapper';
                
                if (question.type === 'mcq') {
                  // Multiple choice question
                  const options = question.options || [];
                  questionElement.innerHTML = \`
                    <div class="question" data-question-id="\${index}" data-question-type="mcq">
                      <h3>Question \${questionNumber}: \${question.text || question.question}</h3>
                      <ul class="options">
                        \${options.map((option, optIndex) => \`
                          <li>
                            <input type="radio" id="q\${index}_o\${optIndex}" name="q\${index}" value="\${option}">
                            <label for="q\${index}_o\${optIndex}">\${option}</label>
                          </li>
                        \`).join('')}
                      </ul>
                    </div>
                  \`;
                } else if (question.type === 'shortanswer') {
                  // Short answer question
                  questionElement.innerHTML = \`
                    <div class="question" data-question-id="\${index}" data-question-type="shortanswer">
                      <h3>Question \${questionNumber}: \${question.text || question.question}</h3>
                      <div class="answer-area">
                        <textarea id="q\${index}_answer" name="q\${index}_answer" placeholder="Enter your answer here..."></textarea>
                      </div>
                    </div>
                  \`;
                } else if (question.type === 'truefalse') {
                  // True/False question
                  questionElement.innerHTML = \`
                    <div class="question" data-question-id="\${index}" data-question-type="truefalse">
                      <h3>Question \${questionNumber}: \${question.text || question.question}</h3>
                      <ul class="options">
                        <li>
                          <input type="radio" id="q\${index}_true" name="q\${index}" value="true">
                          <label for="q\${index}_true">True</label>
                        </li>
                        <li>
                          <input type="radio" id="q\${index}_false" name="q\${index}" value="false">
                          <label for="q\${index}_false">False</label>
                        </li>
                      </ul>
                    </div>
                  \`;
                } else if (question.type === 'essay') {
                  // Essay question
                  questionElement.innerHTML = \`
                    <div class="question" data-question-id="\${index}" data-question-type="essay">
                      <h3>Question \${questionNumber}: \${question.text || question.question}</h3>
                      <div class="answer-area">
                        <textarea id="q\${index}_essay" name="q\${index}_essay" placeholder="Enter your answer here..."></textarea>
                      </div>
                    </div>
                  \`;
                } else {
                  // Default question type
                  questionElement.innerHTML = \`
                    <div class="question" data-question-id="\${index}" data-question-type="default">
                      <h3>Question \${questionNumber}: \${question.text || question.question}</h3>
                      <div class="answer-area">
                        <textarea id="q\${index}_answer" name="q\${index}_answer" placeholder="Enter your answer here..."></textarea>
                      </div>
                    </div>
                  \`;
                }
                
                container.appendChild(questionElement);
              });
            };
            
            // Collect answers from the form
            const collectAnswers = () => {
              const questionElements = document.querySelectorAll('.question');
              const answers = [];
              
              questionElements.forEach(element => {
                const questionId = element.dataset.questionId;
                const questionType = element.dataset.questionType;
                const question = questions[questionId];
                let answer = null;
                
                if (questionType === 'mcq' || questionType === 'truefalse') {
                  const selectedOption = element.querySelector('input[name="q' + questionId + '"]:checked');
                  answer = selectedOption ? selectedOption.value : null;
                } else if (questionType === 'shortanswer' || questionType === 'essay' || questionType === 'default') {
                  const textarea = element.querySelector('textarea');
                  answer = textarea ? textarea.value : null;
                }
                
                answers.push({
                  questionId,
                  questionText: question.text || question.question,
                  questionType,
                  answer,
                  correctAnswer: question.correctAnswer || question.answer || null
                });
              });
              
              return answers;
            };
            
            // Submit the exam
            const submitExam = (automatic = false) => {
              // Collect answers
              const answers = collectAnswers();
              
              // Calculate basic stats
              const totalQuestions = questions.length;
              let correctCount = 0;
              let incorrectCount = 0;
              let unattemptedCount = 0;
              
              answers.forEach(answer => {
                if (!answer.answer) {
                  unattemptedCount++;
                } else if (answer.correctAnswer && answer.answer.toLowerCase() === answer.correctAnswer.toLowerCase()) {
                  correctCount++;
                } else {
                  incorrectCount++;
                }
              });
              
              // Prepare exam data
              const submissionData = {
                ...examData,
                answers,
                submitTime: new Date().toISOString(),
                timeTaken: calculateTimeTaken(),
                totalQuestions,
                correctCount,
                incorrectCount,
                unattemptedCount,
                automatic
              };
              
              // Send back to parent window
              if (window.opener) {
                window.opener.postMessage({ 
                  examData: submissionData
                }, '*');
                
                // Also dispatch a custom event for direct handling
                const event = new CustomEvent('examCompleted', { detail: submissionData });
                window.opener.document.dispatchEvent(event);
                
                if (automatic) {
                  const timeUpEvent = new CustomEvent('examTimeUp', { detail: submissionData });
                  window.opener.document.dispatchEvent(timeUpEvent);
                  
                  alert('Time\'s up! Your exam has been automatically submitted.');
                } else {
                  alert('Your exam has been submitted successfully.');
                }
                
                setTimeout(() => {
                  window.close();
                }, 1000);
              } else {
                console.error('Could not communicate with parent window');
                alert('Error submitting exam. Please try again.');
              }
            };
            
            // Calculate time taken
            const calculateTimeTaken = () => {
              const startTime = new Date(examData.startTime);
              const endTime = new Date();
              const diffMs = endTime - startTime;
              const diffMins = Math.floor(diffMs / 60000);
              const diffSecs = Math.floor((diffMs % 60000) / 1000);
              return \`\${diffMins}m \${diffSecs}s\`;
            };
            
            // Timer functionality
            const startTimer = () => {
              const timerElement = document.getElementById('exam-timer');
              let totalSeconds = ${exam.duration} * 60;
              
              const timerInterval = setInterval(() => {
                totalSeconds--;
                
                if (totalSeconds <= 0) {
                  clearInterval(timerInterval);
                  submitExam(true); // Auto-submit when time's up
                  return;
                }
                
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                
                timerElement.textContent = \`\${minutes}:\${seconds < 10 ? '0' : ''}\${seconds}\`;
                
                // Warning when 5 minutes remaining
                if (totalSeconds === 300) {
                  alert('5 minutes remaining in the exam!');
                }
              }, 1000);
            };
            
            // Initialize exam
            document.addEventListener('DOMContentLoaded', () => {
              // Render questions
              renderQuestions();
              
              // Set up form submission
              document.getElementById('examForm').addEventListener('submit', (event) => {
                event.preventDefault();
                submitExam();
              });
              
              // Start the timer
              startTimer();
            });
          </script>
        </body>
        </html>
      `;
      
      // Write the content to the exam window
      newWindow.document.write(examContent);
      newWindow.document.close();
    }
  };
  
  return { handleViewExam };
};

export default ExamSectionedRenderer;
