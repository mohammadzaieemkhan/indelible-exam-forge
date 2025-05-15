
import React from 'react';
import { IExam } from '@/components/ExamTabs';
import { parseQuestions } from './utils/examParser';
import { ParsedQuestion } from './types/examTypes';
import ReactMarkdown from 'react-markdown';

// Generate HTML for the exam with the two-panel layout
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
    let cleanText = question.text;
    if (question.correctAnswer) {
      cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False|.*)/i, '');
    }
    
    // Format based on question type
    if (question.type === 'mcq' && question.options) {
      optionsHtml = question.options.map(option => {
        const optionLetter = option.charAt(0);
        // Clean the option text (remove any markdown artifacts)
        const cleanOption = option.replace(/^\s*[A-D][).]\s*/, '').trim();
        return `
          <div class="option">
            <input type="radio" name="question-${question.id}" id="option-${question.id}-${optionLetter}" value="${optionLetter}" onchange="saveAnswer(${question.id}, '${optionLetter}', 'mcq')">
            <label for="option-${question.id}-${optionLetter}" class="markdown-content">${cleanOption}</label>
          </div>
        `;
      }).join('');
    } else if (question.type === 'trueFalse') {
      optionsHtml = `
        <div class="option">
          <input type="radio" name="question-${question.id}" id="option-${question.id}-true" value="True" onchange="saveAnswer(${question.id}, 'True', 'trueFalse')">
          <label for="option-${question.id}-true">True</label>
        </div>
        <div class="option">
          <input type="radio" name="question-${question.id}" id="option-${question.id}-false" value="False" onchange="saveAnswer(${question.id}, 'False', 'trueFalse')">
          <label for="option-${question.id}-false">False</label>
        </div>
      `;
    } else if (question.type === 'shortAnswer') {
      optionsHtml = `
        <div class="short-answer-container">
          <textarea name="question-${question.id}" id="answer-${question.id}" placeholder="Enter your answer here..." 
            rows="3" class="short-answer-input" oninput="saveAnswer(${question.id}, this.value, 'shortAnswer')"></textarea>
          <div class="answer-instructions">Write a brief, focused response (1-3 sentences)</div>
        </div>
      `;
    } else if (question.type === 'essay') {
      optionsHtml = `
        <div class="essay-container">
          <textarea name="question-${question.id}" id="answer-${question.id}" placeholder="Write your essay here..." 
            rows="8" class="essay-input" oninput="saveAnswer(${question.id}, this.value, 'essay')"></textarea>
          <div class="answer-instructions">Write a detailed response (recommended: 250-500 words)</div>
        </div>
      `;
    }
    
    // Extract just the question part (without instructions like "Select one:" etc.)
    const questionText = cleanText ? cleanText.trim() : `Question ${question.id}`;
    
    return `
      <div class="question-content" id="question-content-${question.id}" ${index > 0 ? 'style="display: none;"' : ''}>
        <h3>Q${question.id}. <span class="markdown-content">${questionText}</span></h3>
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
        
        .short-answer-container, .essay-container {
          width: 100%;
        }
        
        .answer-instructions {
          margin-top: 5px;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }
        
        .short-answer-input, .essay-input {
          width: 100%;
          padding: 12px;
          border-radius: 5px;
          border: 1px solid var(--light-gray);
          background-color: var(--white);
          color: #333;
          font-size: 1rem;
          resize: vertical;
          margin-bottom: 5px;
        }
        
        .essay-input {
          min-height: 200px;
        }
        
        textarea:focus {
          outline: none;
          border-color: var(--blue);
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.25);
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
        
        /* Markdown content styling */
        .markdown-content {
          line-height: 1.6;
        }
        
        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3, 
        .markdown-content h4 {
          margin-top: 1em;
          margin-bottom: 0.5em;
        }
        
        .markdown-content p {
          margin-bottom: 1em;
        }
        
        .markdown-content ul, 
        .markdown-content ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }
        
        .markdown-content code {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }
        
        .markdown-content pre {
          background-color: rgba(0, 0, 0, 0.1);
          padding: 1em;
          border-radius: 5px;
          overflow-x: auto;
        }
        
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 1em;
        }
        
        .markdown-content th, 
        .markdown-content td {
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.5em;
          text-align: left;
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
      <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
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
              <span>Not Visited</span>
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
        let currentQuestion = allQuestions[0] || 1;
        
        // Track user answers
        const userAnswers = {};
        
        // Initialize all questions as not visited
        allQuestions.forEach(qId => {
          questionStatus[qId] = 'not-visited';
        });
        
        // Set the first question as the current one
        questionStatus[currentQuestion] = 'current';
        updateQuestionNumbers();
        
        // Parse markdown content on page load
        document.addEventListener('DOMContentLoaded', function() {
          // Render all markdown content
          const markdownElements = document.querySelectorAll('.markdown-content');
          markdownElements.forEach(element => {
            try {
              if (element && element.textContent) {
                element.innerHTML = marked.parse(element.textContent || '');
              }
            } catch (e) {
              console.error('Error parsing markdown:', e);
            }
          });
          
          // Attach event listeners to all inputs
          attachEventListeners();
        });
        
        // Attach event listeners to all inputs
        function attachEventListeners() {
          // For radio buttons (MCQ and True/False)
          document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', function() {
              const questionId = parseInt(this.name.split('-')[1]);
              const type = this.name.includes('true') || this.name.includes('false') ? 'trueFalse' : 'mcq';
              saveAnswer(questionId, this.value, type);
            });
          });
          
          // For textareas (Short Answer and Essay)
          document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', function() {
              const questionId = parseInt(this.name.split('-')[1]);
              const type = this.classList.contains('essay-input') ? 'essay' : 'shortAnswer';
              saveAnswer(questionId, this.value, type);
            });
            
            // Also add blur event to ensure answer is saved when focus is lost
            textarea.addEventListener('blur', function() {
              const questionId = parseInt(this.name.split('-')[1]);
              const type = this.classList.contains('essay-input') ? 'essay' : 'shortAnswer';
              saveAnswer(questionId, this.value, type);
            });
          });
        }
        
        // Save user answers and update question status
        function saveAnswer(questionId, answer, type) {
          console.log('Saving answer for question', questionId, ':', answer, '(', type, ')');
          
          // Save the answer with the correct key format that will be expected when processing results
          if (type === 'mcq') {
            // Convert index to actual question position for MCQ
            const mcqIndex = allQuestions.indexOf(questionId);
            if (mcqIndex >= 0) {
              userAnswers['q' + mcqIndex] = answer;
            }
          } else if (type === 'trueFalse') {
            // Convert index to actual question position for True/False
            const tfIndex = allQuestions.filter(id => {
              const element = document.querySelector(\`#question-content-\${id}\`);
              return element && element.innerHTML.includes('True') && element.innerHTML.includes('False');
            }).indexOf(questionId);
            
            if (tfIndex >= 0) {
              userAnswers['tf' + tfIndex] = answer.toLowerCase();
            }
          } else if (type === 'shortAnswer') {
            const saIndex = allQuestions.filter(id => {
              const element = document.querySelector(\`#question-content-\${id}\`);
              return element && element.querySelector('.short-answer-input');
            }).indexOf(questionId);
            
            if (saIndex >= 0) {
              userAnswers['sa' + saIndex] = answer;
            }
          } else if (type === 'essay') {
            const essayIndex = allQuestions.filter(id => {
              const element = document.querySelector(\`#question-content-\${id}\`);
              return element && element.querySelector('.essay-input');
            }).indexOf(questionId);
            
            if (essayIndex >= 0) {
              userAnswers['essay' + essayIndex] = answer;
            }
          }
          
          // Also save a direct mapping of question ID to answer for backup
          userAnswers['question-' + questionId] = {
            value: answer,
            type: type
          };
          
          // Update question status based on answer
          if (answer && answer.trim() !== '') {
            questionStatus[questionId] = 'answered';
          } else {
            questionStatus[questionId] = 'unanswered';
          }
          
          // Debug
          console.log('Current answers:', userAnswers);
          
          // Update the visual state of question numbers
          updateQuestionNumbers();
        }
        
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
          
          // Save the interval ID to be able to clear it later
          window.timerInterval = interval;
        }
        
        // Start the timer
        startTimer(${durationMinutes});
        
        // Confirm before submitting
        function confirmSubmit() {
          const unansweredCount = Object.values(questionStatus).filter(
            status => status === 'unanswered' || status === 'not-visited' || status === 'marked'
          ).length;
          
          if (unansweredCount > 0) {
            const confirm = window.confirm(
              \`You have \${unansweredCount} unanswered or marked questions. Are you sure you want to submit?\`
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
          // Clear the timer
          if (window.timerInterval) {
            clearInterval(window.timerInterval);
          }
          
          // Get question text and type for each question
          const examQuestions = [];
          ${JSON.stringify(questions)}.forEach((question, index) => {
            let options = undefined;
            if (question.options && question.options.length > 0) {
              options = question.options;
            }
            
            examQuestions.push({
              question: question.text,
              type: question.type,
              options: options,
              answer: question.correctAnswer
            });
          });
          
          // Calculate time taken
          const duration = ${durationMinutes};
          const elapsedSeconds = (duration * 60) - Math.max(0, parseInt(document.getElementById('timer').textContent.match(/\\d+/g)[0]) * 60 + parseInt(document.getElementById('timer').textContent.match(/\\d+/g)[1]));
          const minutes = Math.floor(elapsedSeconds / 60);
          const seconds = elapsedSeconds % 60;
          const timeTaken = \`\${minutes}m \${seconds}s\`;
          
          // Prepare exam data for submission
          const examData = {
            examId: "${exam.id || ''}",
            examName: "${exam.name || 'Exam'}",
            date: "${new Date().toISOString().split('T')[0]}",
            topics: ${JSON.stringify(exam.topics || [])},
            questions: examQuestions,
            answers: userAnswers,
            timeTaken: timeTaken,
            questionTypes: examQuestions.map(q => q.type),
            questionWeights: ${JSON.stringify(exam.questionWeights || {})},
          };
          
          console.log('Submitting exam data with answers:', examData);
          
          // Store the data in localStorage as backup
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          localStorage.setItem('completedExamId', examData.examId);
          
          // Show completion message
          document.body.innerHTML = \`
            <div style="max-width: 600px; margin: 100px auto; text-align: center; padding: 30px; background-color: #004d40; color: white; border-radius: 10px;">
              <h1>Exam Submitted</h1>
              <p>Thank you for completing the exam. Your answers have been recorded.</p>
              <p>Your exam is being evaluated and results will be available in the Performance tab.</p>
            </div>
          \`;
          
          // Notify the parent window that the exam is complete
          if (window.opener) {
            try {
              window.opener.postMessage({ type: 'examCompleted', examData }, '*');
              console.log('Message sent to parent window:', examData);
            } catch (e) {
              console.error('Could not send message to parent window:', e);
              
              // As a failsafe, try to close and reload
              setTimeout(() => {
                window.close();
                if (window.opener) {
                  window.opener.location.reload();
                }
              }, 3000);
            }
          }
          
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
