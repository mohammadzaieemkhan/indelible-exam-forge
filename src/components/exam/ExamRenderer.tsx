import React from 'react';
import { IExam } from '@/components/ExamTabs';
import { parseQuestions } from './utils/examParser';

// Interface for parsed question
export interface ParsedQuestion {
  id: number;
  text: string;
  type: 'mcq' | 'shortAnswer' | 'essay' | 'trueFalse' | 'unknown';
  options?: string[];
  correctAnswer?: string;
  weight?: number;
}

// Generate HTML for the exam with the new two-panel layout
export const generateExamHtml = (exam: IExam, questions: ParsedQuestion[]): string => {
  // Create question numbers for the left panel
  const questionNumbersHtml = questions.map((question) => {
    return `
      <div class="question-number" data-id="${question.id}">
        ${question.id}
      </div>
    `;
  }).join('');
  
  // Create question content for the right panel
  const questionsHtml = questions.map((question, index) => {
    let optionsHtml = '';
    
    // Clean up the question text by removing the answer part
    let cleanText = question.text || '';
    if (question.correctAnswer) {
      cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False)/i, '');
    }
    
    // Format based on question type
    if (question.type === 'mcq' && question.options) {
      optionsHtml = question.options.map(option => {
        const optionLetter = option.charAt(0);
        return `
          <div class="option">
            <input type="radio" name="question-${question.id}" id="option-${question.id}-${optionLetter}">
            <label for="option-${question.id}-${optionLetter}">${option}</label>
          </div>
        `;
      }).join('');
    } else if (question.type === 'trueFalse') {
      optionsHtml = `
        <div class="option">
          <input type="radio" name="question-${question.id}" id="option-${question.id}-true">
          <label for="option-${question.id}-true">True</label>
        </div>
        <div class="option">
          <input type="radio" name="question-${question.id}" id="option-${question.id}-false">
          <label for="option-${question.id}-false">False</label>
        </div>
      `;
    } else if (question.type === 'shortAnswer' || question.type === 'short answer' || question.type.includes('short')) {
      optionsHtml = `<textarea class="short-answer-textarea" placeholder="Enter your answer here..." rows="3" name="textarea-${question.id}"></textarea>`;
    } else if (question.type === 'essay' || question.type.includes('essay')) {
      optionsHtml = `<textarea class="essay-textarea" placeholder="Write your essay here..." rows="8" name="textarea-${question.id}"></textarea>`;
    }
    
    // Extract just the question part (without instructions like "Select one:" etc.)
    // Add a null check for cleanText
    let questionText = cleanText;
    if (cleanText) {
      questionText = cleanText.replace(/.*?([A-Za-z0-9].*?\?)/s, '$1').trim();
    }
    
    return `
      <div class="question-content" id="question-content-${question.id}" ${index > 0 ? 'style="display: none;"' : ''}>
        <h3>Q${question.id}. ${questionText}</h3>
        <div class="options-container">
          ${optionsHtml}
        </div>
        <div class="navigation-buttons">
          ${index > 0 ? '<button class="nav-button back-button" onclick="showQuestion(' + (question.id - 1) + ')">Back</button>' : '<button class="nav-button back-button" disabled>Back</button>'}
          <button class="nav-button mark-button" onclick="markForReview(${question.id})">Mark For Review</button>
          ${index < questions.length - 1 ? '<button class="nav-button next-button" onclick="showQuestion(' + (question.id + 1) + ')">Next</button>' : '<button class="nav-button next-button" onclick="confirmSubmit()">Submit</button>'}
        </div>
      </div>
    `;
  }).join('');
  
  // Calculate exam duration in minutes
  const durationMinutes = exam.duration ? parseInt(exam.duration) : 60;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${exam.name || 'Exam'}</title>
      <style>
        :root {
          --dark-green: #004d40;
          --light-green: #00796b;
          --white: #ffffff;
          --light-gray: #f5f5f5;
          --blue: #2196f3;
          --red: #f44336;
          --dark-blue: #01579b;
        }
        
        body, html {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          height: 100%;
          overflow: hidden;
          color: var(--white);
          line-height: 1.5;
        }
        
        #exam-container {
          display: flex;
          height: 100vh;
        }
        
        /* Left panel - Question numbers */
        #questions-panel {
          width: 20%;
          min-width: 200px;
          background-color: var(--dark-green);
          padding: 20px 10px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        
        .panel-heading {
          text-align: center;
          margin-bottom: 20px;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .question-numbers-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          justify-items: center;
          margin-bottom: 30px;
        }
        
        .question-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--white);
          color: var(--dark-green);
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .question-number:hover {
          transform: scale(1.05);
        }
        
        .question-number.active {
          background-color: var(--blue);
          color: var(--white);
          box-shadow: 0 0 0 2px var(--white);
        }
        
        .question-number.answered {
          background-color: var(--blue);
          color: var(--white);
        }
        
        .question-number.unanswered {
          background-color: var(--red);
          color: var(--white);
        }
        
        .question-number.marked {
          background-color: var(--dark-blue);
          color: var(--white);
        }
        
        .legend {
          margin-top: auto;
          padding-top: 20px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .legend-color {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 10px;
        }
        
        .answered-color {
          background-color: var(--blue);
        }
        
        .unanswered-color {
          background-color: var(--red);
        }
        
        .marked-color {
          background-color: var(--dark-blue);
        }
        
        .not-visited-color {
          background-color: var(--white);
          border: 1px solid var(--light-gray);
        }
        
        .submit-button {
          margin-top: 20px;
          background-color: var(--blue);
          color: var(--white);
          border: none;
          border-radius: 20px;
          padding: 12px 30px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          width: 100%;
          transition: background-color 0.3s ease;
        }
        
        .submit-button:hover {
          background-color: #1976d2;
        }
        
        /* Right panel - Question content */
        #content-panel {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
          background-color: var(--light-green);
          position: relative;
        }
        
        .timer {
          position: absolute;
          top: 20px;
          left: 20px;
          background-color: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
        }
        
        .question-content {
          background-color: var(--dark-green);
          padding: 30px;
          border-radius: 10px;
          margin-top: 50px;
        }
        
        .question-content h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 1.3rem;
        }
        
        .options-container {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .option {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .option input[type="radio"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .option label {
          cursor: pointer;
        }
        
        textarea {
          width: 100%;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid var(--light-gray);
          background-color: var(--white);
          color: #333;
          font-size: 1rem;
          resize: vertical;
        }
        
        textarea.short-answer-textarea, textarea.essay-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid var(--light-gray);
          background-color: var(--white);
          color: #333;
          font-size: 1rem;
          resize: vertical;
          min-height: 80px;
          margin-bottom: 10px;
        }
        
        textarea.essay-textarea {
          min-height: 150px;
        }
        
        .navigation-buttons {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        
        .nav-button {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          font-weight: bold;
          cursor: pointer;
          min-width: 120px;
          transition: all 0.3s ease;
        }
        
        .back-button {
          background-color: var(--white);
          color: var(--dark-green);
        }
        
        .mark-button {
          background-color: var(--dark-blue);
          color: var(--white);
        }
        
        .next-button {
          background-color: var(--white);
          color: var(--dark-green);
        }
        
        .nav-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .nav-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          #exam-container {
            flex-direction: column;
          }
          
          #questions-panel {
            width: 100%;
            min-width: auto;
            max-height: 200px;
            padding: 10px;
          }
          
          .question-numbers-grid {
            grid-template-columns: repeat(6, 1fr);
          }
          
          .question-number {
            width: 32px;
            height: 32px;
          }
          
          .legend {
            display: none;
          }
          
          #content-panel {
            padding: 15px;
          }
          
          .timer {
            top: 10px;
            left: 10px;
          }
          
          .question-content {
            padding: 20px;
            margin-top: 40px;
          }
        }
      </style>
    </head>
    <body>
      <div id="exam-container">
        <!-- Left panel with question numbers -->
        <div id="questions-panel">
          <div class="panel-heading">Question</div>
          
          <div class="question-numbers-grid">
            ${questionNumbersHtml}
          </div>
          
          <div class="legend">
            <div class="legend-item">
              <div class="legend-color answered-color"></div>
              <span>Answered</span>
            </div>
            <div class="legend-item">
              <div class="legend-color unanswered-color"></div>
              <span>Unanswered</span>
            </div>
            <div class="legend-item">
              <div class="legend-color marked-color"></div>
              <span>Mark for review</span>
            </div>
            <div class="legend-item">
              <div class="legend-color not-visited-color"></div>
              <span>No Visited</span>
            </div>
          </div>
          
          <button class="submit-button" onclick="confirmSubmit()">Submit</button>
        </div>
        
        <!-- Right panel with question content -->
        <div id="content-panel">
          <div class="timer" id="timer">Time Remaining : ${durationMinutes}:00</div>
          
          ${questionsHtml}
        </div>
      </div>
      
      <script>
        // Track question statuses
        const questionStatus = {};
        const allQuestions = ${JSON.stringify(questions.map(q => q.id))};
        let currentQuestion = 1;
        const examStartTime = new Date();
        const examId = "${exam.id || ''}";
        const examName = "${exam.name || 'Exam'}";
        const examDate = "${exam.date || new Date().toISOString().split('T')[0]}";
        
        // Initialize all questions as not visited
        allQuestions.forEach(qId => {
          questionStatus[qId] = 'not-visited';
        });
        
        // Set the first question as the current one
        questionStatus[1] = 'current';
        updateQuestionNumbers();
        
        // Show a specific question
        function showQuestion(questionId) {
          // Hide current question
          document.getElementById(\`question-content-\${currentQuestion}\`).style.display = 'none';
          
          // Show selected question
          document.getElementById(\`question-content-\${questionId}\`).style.display = 'block';
          
          // Update status if this is the first visit
          if (questionStatus[questionId] === 'not-visited') {
            questionStatus[questionId] = 'unanswered';
          }
          
          // Update current question tracker
          currentQuestion = questionId;
          
          // Update the visual state of question numbers
          updateQuestionNumbers();
        }
        
        // Mark a question for review
        function markForReview(questionId) {
          questionStatus[questionId] = questionStatus[questionId] === 'marked' ? 'unanswered' : 'marked';
          updateQuestionNumbers();
        }
        
        // Update the visual state of question numbers
        function updateQuestionNumbers() {
          const questionNumberElements = document.querySelectorAll('.question-number');
          
          questionNumberElements.forEach(el => {
            const qId = parseInt(el.getAttribute('data-id'));
            
            // Remove all classes first
            el.classList.remove('active', 'answered', 'unanswered', 'marked');
            
            // Add appropriate class based on status
            if (qId === currentQuestion) {
              el.classList.add('active');
            }
            
            if (questionStatus[qId]) {
              el.classList.add(questionStatus[qId]);
            }
          });
        }
        
        // Add click event to question numbers
        document.querySelectorAll('.question-number').forEach(el => {
          el.addEventListener('click', function() {
            const qId = parseInt(this.getAttribute('data-id'));
            showQuestion(qId);
          });
        });
        
        // Capture radio button changes to track answered questions
        document.addEventListener('change', function(e) {
          if (e.target.type === 'radio') {
            const questionId = parseInt(e.target.name.split('-')[1]);
            questionStatus[questionId] = 'answered';
            updateQuestionNumbers();
          }
        });
        
        // Capture input changes for textarea questions (short answer and essay)
        document.addEventListener('input', function(e) {
          if (e.target.tagName === 'TEXTAREA') {
            // Check if the textarea has content
            if (e.target.value.trim().length > 0) {
              // Find the question number from the textarea name or closest container
              let questionId;
              if (e.target.name && e.target.name.startsWith('textarea-')) {
                questionId = parseInt(e.target.name.split('-')[1]);
              } else {
                // Find the closest question container to get the ID
                const questionContent = e.target.closest('.question-content');
                if (questionContent) {
                  questionId = parseInt(questionContent.id.split('-')[2]);
                }
              }
              
              if (questionId) {
                questionStatus[questionId] = 'answered';
                updateQuestionNumbers();
              }
            }
          }
        });
        
        // Timer functionality
        function startTimer(minutes) {
          let totalSeconds = minutes * 60;
          const timerElement = document.getElementById('timer');
          
          const interval = setInterval(() => {
            totalSeconds--;
            if (totalSeconds <= 0) {
              clearInterval(interval);
              alert('Time is up! Your exam will be submitted.');
              submitExam();
              return;
            }
            
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            timerElement.textContent = \`Time Remaining : \${mins}:\${secs < 10 ? '0' : ''}\${secs}\`;
            
            // Change color when time is running low
            if (totalSeconds < 300) { // Less than 5 minutes
              timerElement.style.backgroundColor = 'rgba(244, 67, 54, 0.7)';
            } else if (totalSeconds < 600) { // Less than 10 minutes
              timerElement.style.backgroundColor = 'rgba(255, 152, 0, 0.7)';
            }
          }, 1000);
        }
        
        // Start the timer
        startTimer(${durationMinutes});
        
        // Confirm before submitting
        function confirmSubmit() {
          const unansweredCount = Object.values(questionStatus).filter(
            status => status === 'unanswered' || status === 'not-visited'
          ).length;
          
          if (unansweredCount > 0) {
            const confirm = window.confirm(
              \`You have \${unansweredCount} unanswered questions. Are you sure you want to submit?\`
            );
            if (confirm) {
              submitExam();
            }
          } else {
            submitExam();
          }
        }
        
        // Submit the exam
        function submitExam() {
          // Calculate time taken
          const endTime = new Date();
          const timeTaken = Math.floor((endTime - examStartTime) / 1000 / 60); // in minutes
          
          // Collect all answers
          const answers = {};
          
          document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            const questionId = radio.name.split('-')[1];
            const value = radio.id.split('-')[2];
            answers[questionId] = value;
          });
          
          document.querySelectorAll('textarea').forEach(textarea => {
            if (textarea.value.trim()) {
              let questionId;
              if (textarea.name && textarea.name.startsWith('textarea-')) {
                questionId = textarea.name.split('-')[1];
              } else {
                // Find the closest question container to get the ID
                const questionContent = textarea.closest('.question-content');
                if (questionContent) {
                  questionId = questionContent.id.split('-')[2];
                }
              }
              
              if (questionId) {
                answers[questionId] = textarea.value.trim();
              }
            }
          });
          
          // Create exam data for evaluation
          const examData = {
            examId: examId,
            examName: examName,
            date: examDate,
            answers: answers,
            questions: ${JSON.stringify(questions)},
            timeTaken: timeTaken + ' minutes',
            questionWeights: ${JSON.stringify(exam.questionWeights || {})}
          };
          
          console.log('Exam submitted with answers:', answers);
          console.log('Complete exam data:', examData);
          
          // Try to send the data to the parent window
          try {
            if (window.opener) {
              window.opener.postMessage({
                type: 'examCompleted',
                examData: examData
              }, '*');
              
              console.log('Posted message to parent window');
            } else {
              console.log('No parent window found, saving to localStorage');
              // If no parent window, save to localStorage as fallback
              localStorage.setItem('completedExamId', examId);
              localStorage.setItem('lastExamResults', JSON.stringify(examData));
            }
          } catch (e) {
            console.error('Error sending exam data:', e);
            // Fallback to localStorage
            localStorage.setItem('completedExamId', examId);
            localStorage.setItem('lastExamResults', JSON.stringify(examData));
          }
          
          // Show completion message
          document.body.innerHTML = \`
            <div style="max-width: 600px; margin: 100px auto; text-align: center; padding: 30px; background-color: #004d40; color: white; border-radius: 10px;">
              <h1>Exam Submitted</h1>
              <p>Thank you for completing the exam. Your answers have been recorded.</p>
              <p>You will be redirected to the results page shortly.</p>
            </div>
          \`;
          
          // Close the window after a delay
          setTimeout(() => {
            window.close();
          }, 3000);
        }
      </script>
    </body>
    </html>
  `;
};

// Export the parseQuestions function to be used elsewhere
export { parseQuestions };
