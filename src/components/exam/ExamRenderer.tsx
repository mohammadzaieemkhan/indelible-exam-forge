
import React from "react";
import { ParsedQuestionItem, parseQuestions, markdownToHtml } from "./utils/examParser";
import { IExam } from "@/components/ExamTabs";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
        </div>
      `;
    case 'essay':
      return `
        <div class="textarea-container">
          <textarea class="essay-input" id="answer-${index}" 
            placeholder="Write your essay here..."
            onchange="saveAnswer(${index}, this.value)"></textarea>
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
          --warning: #f59e0b;
          --warning-foreground: #78350f;
          --success: #10b981;
          --success-foreground: white;
          --card: #ffffff;
          --card-foreground: #0f172a;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          :root {
            --primary: #3b82f6;
            --primary-hover: #2563eb;
            --primary-foreground: white;
            --background: #0f172a;
            --foreground: #f8fafc;
            --accent: #1e293b;
            --accent-foreground: #f1f5f9;
            --muted: #1e293b;
            --muted-foreground: #94a3b8;
            --border: #334155;
            --border-hover: #475569;
            --card: #1e293b;
            --card-foreground: #f1f5f9;
            --text: #f1f5f9;
          }
        }
        
        /* General styles */
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: var(--card-foreground);
          background-color: var(--background);
          margin: 0;
          padding: 0;
        }
        
        * {
          box-sizing: border-box;
        }
        
        #exam-container {
          display: flex;
          height: 100vh;
        }
        
        /* Sidebar styles */
        .sidebar {
          width: 250px;
          flex-shrink: 0;
          border-right: 1px solid var(--border);
          overflow-y: auto;
          background-color: var(--accent);
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 5px rgba(0, 0, 0, 0.05);
          color: var(--accent-foreground);
        }
        
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid var(--border);
          background-color: var(--primary);
          color: var(--primary-foreground);
        }
        
        .sidebar-header h2 {
          margin: 0;
          font-size: 18px;
          color: var(--primary-foreground);
        }
        
        .sidebar-header p {
          margin: 5px 0 0 0;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .sidebar-timer {
          padding: 15px 20px;
          border-bottom: 1px solid var(--border);
          font-size: 16px;
          font-weight: 600;
          color: var(--accent-foreground);
          background-color: var(--muted);
          text-align: center;
        }
        
        .sidebar-progress {
          padding: 15px 20px;
          border-bottom: 1px solid var(--border);
        }
        
        .progress-bar {
          height: 8px;
          background-color: var(--muted);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 10px;
        }
        
        .progress-value {
          height: 100%;
          background-color: var(--primary);
          width: 0%;
          transition: width 0.3s ease;
        }
        
        .progress-stats {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
          font-size: 12px;
          color: var(--muted-foreground);
        }
        
        .question-grid {
          padding: 15px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        
        .question-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          cursor: pointer;
          background-color: var(--muted);
          color: var(--muted-foreground);
          transition: all 0.2s ease;
        }
        
        .question-number:hover {
          transform: scale(1.05);
          box-shadow: 0 0 0 2px var(--border-hover);
        }
        
        .question-number.current {
          background-color: var(--primary);
          color: var(--primary-foreground);
          font-weight: 600;
        }
        
        .question-number.answered {
          background-color: var(--success);
          color: var(--success-foreground);
        }
        
        .question-number.for-review {
          background-color: var(--warning);
          color: var(--warning-foreground);
        }
        
        .sidebar-legend {
          padding: 15px 20px;
          border-bottom: 1px solid var(--border);
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .legend-color {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .legend-current { background-color: var(--primary); }
        .legend-answered { background-color: var(--success); }
        .legend-review { background-color: var(--warning); }
        .legend-unanswered { background-color: var(--muted); }
        
        .sidebar-actions {
          padding: 15px 20px;
          margin-top: auto;
        }
        
        /* Section styling */
        .section-container {
          margin-bottom: 20px;
        }
        
        .section-header {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--primary);
        }
        
        .section-header h2 {
          font-size: 20px;
          margin: 0;
          color: var(--accent-foreground);
        }
        
        /* Main content styles */
        .main-content {
          flex-grow: 1;
          padding: 20px;
          overflow-y: auto;
          background-color: var(--background);
          color: var(--accent-foreground);
        }
        
        .question-container {
          border: 1px solid var(--border);
          border-radius: 8px;
          margin-bottom: 20px;
          padding: 20px;
          background-color: var(--card);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          color: var(--card-foreground);
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .question-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--accent-foreground);
        }
        
        .question-section {
          background-color: var(--muted);
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
          color: var(--muted-foreground);
        }
        
        .question-content {
          margin-bottom: 20px;
          color: var(--accent-foreground);
        }
        
        .question-content h1, 
        .question-content h2, 
        .question-content h3 {
          margin-top: 0;
          color: var(--accent-foreground);
        }
        
        .question-content p {
          margin-bottom: 15px;
          color: var(--accent-foreground);
        }
        
        .question-content ul, 
        .question-content ol {
          margin-bottom: 15px;
          padding-left: 20px;
        }
        
        .question-content code {
          background-color: var(--muted);
          padding: 2px 5px;
          border-radius: 3px;
          font-family: monospace;
        }
        
        /* Options for MCQs with separate radio buttons */
        .options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 15px;
        }
        
        .option {
          padding: 0;
          border: 1px solid var(--border);
          border-radius: 6px;
          background-color: var(--card);
          width: 100%;
          display: flex;
        }
        
        .option-label {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          height: 100%;
          color: var(--card-foreground);
          position: relative;
        }
        
        .option-label:hover {
          background-color: var(--accent);
          border-radius: 5px;
        }
        
        /* Radio button styling improved */
        .radio-input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }
        
        .radio-custom {
          display: block;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-radius: 50%;
          margin-right: 10px;
          position: relative;
        }
        
        .radio-input:checked + .radio-custom::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background-color: var(--primary);
          border-radius: 50%;
        }
        
        .option-text {
          flex-grow: 1;
          padding-left: 5px;
        }
        
        /* Text inputs and textareas */
        .text-input-container,
        .textarea-container {
          width: 100%;
        }
        
        .text-input, .essay-input {
          width: 100%;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 16px;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
          background-color: var(--card);
          color: var(--card-foreground);
        }
        
        .text-input:focus, .essay-input:focus {
          border-color: var(--primary);
          outline: none;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }
        
        .essay-input {
          min-height: 150px;
          resize: vertical;
        }
        
        /* Navigation and actions */
        .navigation {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
          gap: 10px;
        }
        
        .button {
          background-color: var(--primary);
          color: var(--primary-foreground);
          border: none;
          border-radius: 6px;
          padding: 12px 20px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .button:hover {
          background-color: var(--primary-hover);
        }
        
        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .button.secondary {
          background-color: var(--accent);
          color: var(--accent-foreground);
          border: 1px solid var(--border);
        }
        
        .button.secondary:hover {
          background-color: var(--muted);
        }
        
        .button.review {
          background-color: var(--warning);
          color: var(--warning-foreground);
        }
        
        .button.review:hover {
          opacity: 0.9;
        }
        
        .fullscreen-button {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1000;
        }
        
        .fullscreen-icon {
          width: 24px;
          height: 24px;
          color: white;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          #exam-container {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            height: auto;
            max-height: 40vh;
          }
          
          .main-content {
            padding: 15px;
          }
          
          .question-container {
            padding: 15px;
          }
          
          .question-grid {
            grid-template-columns: repeat(5, 1fr);
          }
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
      
      <button class="fullscreen-button" id="fullscreen-button" title="Toggle fullscreen">
        <svg class="fullscreen-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5m-11-9v4m0 0h-4m4 0l-5 5M21 21v-4m0 0h-4m4 0l-5-5" />
        </svg>
      </button>
      
      <script>
        let currentQuestion = 0;
        const totalQuestions = ${questions.length};
        const answers = {};
        const questionsForReview = new Set();
        let startTime = Date.now();
        let timerInterval;
        let questionWeights = ${JSON.stringify(questions.map((_, i) => exam.questionWeights?.[i] || 1))};
        
        // Initialize the exam
        function initExam() {
          console.log("Initializing exam with", totalQuestions, "questions");
          
          // Hide all questions except the first one
          for (let i = 1; i < totalQuestions; i++) {
            document.getElementById('question-' + i).style.display = 'none';
          }
          
          // Setup fullscreen button
          document.getElementById('fullscreen-button').addEventListener('click', toggleFullScreen);
          
          // Start the timer
          startTimer();
          
          // Update navigation buttons
          updateNavButtons();
        }
        
        // Start the exam timer
        function startTimer() {
          timerInterval = setInterval(updateTimer, 1000);
          updateTimer();
        }
        
        // Update the timer display
        function updateTimer() {
          const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
          const hours = Math.floor(elapsedTime / 3600).toString().padStart(2, '0');
          const minutes = Math.floor((elapsedTime % 3600) / 60).toString().padStart(2, '0');
          const seconds = (elapsedTime % 60).toString().padStart(2, '0');
          
          document.getElementById('timer-value').textContent = \`\${hours}:\${minutes}:\${seconds}\`;
        }
        
        // Show question by index
        function showQuestion(index) {
          // Hide current question
          document.getElementById('question-' + currentQuestion).style.display = 'none';
          
          // Show the requested question
          document.getElementById('question-' + index).style.display = 'block';
          
          // Update current question class in buttons
          document.getElementById('question-button-' + currentQuestion).classList.remove('current');
          document.getElementById('question-button-' + index).classList.add('current');
          
          // Update current question index
          currentQuestion = index;
          
          // Update navigation buttons
          updateNavButtons();
        }
        
        // Go to next question
        function nextQuestion() {
          if (currentQuestion < totalQuestions - 1) {
            showQuestion(currentQuestion + 1);
          }
        }
        
        // Go to previous question
        function prevQuestion() {
          if (currentQuestion > 0) {
            showQuestion(currentQuestion - 1);
          }
        }
        
        // Mark current question for review
        function markForReview() {
          const questionBtn = document.getElementById('question-button-' + currentQuestion);
          
          if (questionsForReview.has(currentQuestion)) {
            questionsForReview.delete(currentQuestion);
            questionBtn.classList.remove('for-review');
            
            // Restore the answered class if it was answered
            if (answers['q' + currentQuestion]) {
              questionBtn.classList.add('answered');
            }
          } else {
            questionsForReview.add(currentQuestion);
            questionBtn.classList.add('for-review');
            questionBtn.classList.remove('answered');
          }
          
          // Update the review button text
          updateReviewButtonText();
        }
        
        // Update the review button text based on current state
        function updateReviewButtonText() {
          const reviewButton = document.getElementById('review-button');
          if (questionsForReview.has(currentQuestion)) {
            reviewButton.textContent = 'Remove from Review';
          } else {
            reviewButton.textContent = 'Mark for Review';
          }
        }
        
        // Update navigation buttons state
        function updateNavButtons() {
          document.getElementById('prev-button').disabled = currentQuestion === 0;
          document.getElementById('next-button').disabled = currentQuestion === totalQuestions - 1;
          
          // Update the review button text
          updateReviewButtonText();
        }
        
        // Select an option (for MCQs and true/false)
        function selectOption(questionIndex, optionIndex) {
          // Save the answer
          answers['q' + questionIndex] = optionIndex.toString();
          
          // Update question button to show it's answered
          const questionBtn = document.getElementById('question-button-' + questionIndex);
          if (!questionsForReview.has(questionIndex)) {
            questionBtn.classList.add('answered');
          }
          
          // Update progress
          updateProgress();
        }
        
        // Save answer for text inputs and essays
        function saveAnswer(questionIndex, value) {
          answers['q' + questionIndex] = value;
          
          // Only mark as answered if there's content
          const questionBtn = document.getElementById('question-button-' + questionIndex);
          if (value && value.trim().length > 0 && !questionsForReview.has(questionIndex)) {
            questionBtn.classList.add('answered');
          } else if (!questionsForReview.has(questionIndex)) {
            questionBtn.classList.remove('answered');
          }
          
          // Update progress
          updateProgress();
        }
        
        // Update progress bar and stats
        function updateProgress() {
          const answeredCount = Object.keys(answers).length;
          const percentage = Math.round((answeredCount / totalQuestions) * 100);
          
          document.getElementById('progress-bar').style.width = percentage + '%';
          document.getElementById('progress-text').textContent = \`\${answeredCount} of \${totalQuestions} answered\`;
          document.getElementById('progress-percentage').textContent = percentage + '%';
        }
        
        // Toggle fullscreen
        function toggleFullScreen() {
          if (!document.fullscreenElement) {
            // Standard method
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch(err => {
                console.log('Error attempting to enable fullscreen:', err);
              });
            } 
          } else if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
        
        // Submit the exam
        function submitExam() {
          if (Object.keys(answers).length < totalQuestions / 2) {
            if (!confirm('You have answered less than half of the questions. Are you sure you want to submit?')) {
              return;
            }
          } else if (!confirm('Are you sure you want to submit your exam?')) {
            return;
          }
          
          // Stop the timer
          clearInterval(timerInterval);
          
          // Calculate time taken
          const timeElapsed = Math.floor((Date.now() - startTime) / 1000);
          const hours = Math.floor(timeElapsed / 3600).toString().padStart(2, '0');
          const minutes = Math.floor((timeElapsed % 3600) / 60).toString().padStart(2, '0');
          const seconds = (timeElapsed % 60).toString().padStart(2, '0');
          const timeTaken = \`\${hours}:\${minutes}:\${seconds}\`;
          
          // Prepare the exam data for submission
          const examData = {
            examId: "${exam.id || ''}",
            examName: "${exam.name || ''}",
            date: new Date().toISOString(),
            answers: answers,
            timeTaken: timeTaken,
            questions: ${JSON.stringify(questions.map(q => ({
              question: q.question,
              type: q.type,
              options: q.options || [],
              answer: q.answer || '',
              section: q.section || 'General'
            })))},
            questionWeights: questionWeights,
            questionTypes: ${JSON.stringify(questions.map(q => q.type))}
          };
          
          console.log("Submitting exam data:", examData);
          
          // Store the results in localStorage as fallback
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          localStorage.setItem('completedExamId', "${exam.id || ''}");
          
          // Create and dispatch custom event
          const completedEvent = new CustomEvent('examCompleted', { 
            detail: examData,
            bubbles: true 
          });
          document.dispatchEvent(completedEvent);
          
          // Send the data to the parent window
          window.opener.postMessage({
            type: 'examCompleted',
            examData: examData
          }, "*");
          
          // Show a completion message
          document.body.innerHTML = \`
            <div style="max-width: 600px; margin: 100px auto; padding: 30px; text-align: center; background: var(--card); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); color: var(--card-foreground);">
              <h2 style="color: var(--primary); margin-bottom: 20px; font-size: 24px;">Exam Submitted Successfully!</h2>
              <p style="font-size: 16px; margin-bottom: 10px;">You've completed the exam in \${timeTaken}.</p>
              <p style="font-size: 16px; margin-bottom: 20px;">You answered \${Object.keys(answers).length} out of \${totalQuestions} questions.</p>
              <p style="font-size: 16px; color: var(--muted-foreground); margin-bottom: 30px;">Your results will be processed and will appear in the Performance tab.</p>
              <button onclick="window.close()" style="padding: 10px 25px; background: var(--primary); color: var(--primary-foreground); border: none; border-radius: 6px; font-size: 16px; cursor: pointer; transition: background 0.2s ease;">Close Window</button>
            </div>
          \`;
          
          // Close the window after a delay
          setTimeout(() => {
            window.close();
          }, 5000);
        }
        
        // Initialize the exam when the page loads
        document.addEventListener('DOMContentLoaded', initExam);
      </script>
    </body>
    </html>
  `;
};

const ExamRenderer = ({ exam }: ExamRendererProps) => {
  const { toast } = useToast();

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
