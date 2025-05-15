
// Fix the import to use the correct path and import the new parseQuestions function
import { parseQuestions } from "./utils/examParser";
import { ParsedQuestion } from "./types/examTypes";

// Function to generate the HTML for the exam
export const generateExamHtml = (exam, questions) => {
  // Ensure questions is an array - if not, make it an empty array
  const questionArray = Array.isArray(questions) ? questions : [];
  
  // Create a unique ID for this exam session
  const examSessionId = `exam-session-${Date.now()}`;
  
  // Format the current time and convert the duration to milliseconds
  const startTime = Date.now();
  const durationMs = parseInt(exam.duration || "60") * 60 * 1000;
  const endTime = startTime + durationMs;
  
  // Filter out the answer key questions (they usually have the same question number)
  const questionSet = new Set();
  const uniqueQuestions = questionArray.filter(q => {
    if (!q) return false; // Skip null or undefined questions
    
    // Add null check before accessing question property
    const questionId = q.id || questionArray.indexOf(q) + 1;
    if (!questionSet.has(questionId)) {
      questionSet.add(questionId);
      return true;
    }
    return false;
  });
  
  // Create a mapping of question types for the results
  const questionTypes = uniqueQuestions.map(q => q.type || 'unknown');
  
  // Create a mapping of question weights
  const questionWeights = {};
  uniqueQuestions.forEach((q, idx) => {
    const weight = exam.questionWeights?.[idx] || 1;
    questionWeights[idx] = weight;
  });

  // Group questions by type
  const groupedQuestions = {
    mcq: uniqueQuestions.filter(q => q.type === 'mcq'),
    truefalse: uniqueQuestions.filter(q => q.type === 'trueFalse'),
    shortanswer: uniqueQuestions.filter(q => q.type === 'shortAnswer'),
    essay: uniqueQuestions.filter(q => q.type === 'essay')
  };

  // HTML content for the exam
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${exam.name || 'Exam'} - Exam</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          height: 100vh;
          overflow: hidden;
        }
        #exam-container {
          display: flex;
          height: 100vh;
          width: 100%;
        }
        #timer {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2563eb;
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          font-weight: bold;
          z-index: 1000;
        }
        #timer.warning {
          background: #f59e0b;
        }
        #timer.danger {
          background: #ef4444;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .header {
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 15px;
        }
        .nav-panel {
          width: 250px;
          background-color: #f8f9fa;
          border-right: 1px solid #e2e8f0;
          padding: 20px 0;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .nav-item {
          padding: 12px 20px;
          cursor: pointer;
          transition: background 0.2s;
          border-left: 4px solid transparent;
        }
        .nav-item:hover {
          background-color: #edf2f7;
        }
        .nav-item.active {
          border-left-color: #2563eb;
          background-color: #ebf4ff;
          font-weight: 600;
        }
        .content-panel {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }
        .section {
          display: none;
        }
        .section.active {
          display: block;
        }
        .section-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        .question-container {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
        }
        .question {
          font-weight: bold;
          margin-bottom: 15px;
        }
        .options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .option {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .option label {
          display: flex;
          align-items: flex-start;
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .option label:hover {
          background-color: #f8f9fa;
        }
        input[type="radio"] {
          margin-top: 4px;
          margin-right: 10px;
        }
        textarea {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
          resize: vertical;
          margin-bottom: 10px;
        }
        input[type="text"] {
          width: 100%;
          padding: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          font-family: inherit;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        .upload-btn:hover {
          background-color: #e5e7eb;
        }
        .actions {
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        button {
          background-color: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: background-color 0.3s;
        }
        button:hover {
          background-color: #1d4ed8;
        }
        .hidden {
          display: none;
        }
        .no-questions-message {
          text-align: center;
          padding: 30px;
          background-color: #f9fafb;
          border-radius: 8px;
          margin: 20px 0;
        }
        @media (max-width: 768px) {
          #exam-container {
            flex-direction: column;
          }
          .nav-panel {
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
          }
          .nav-list {
            display: flex;
            overflow-x: auto;
            padding-bottom: 10px;
          }
          .nav-item {
            white-space: nowrap;
            border-left: none;
            border-bottom: 3px solid transparent;
          }
          .nav-item.active {
            border-left-color: transparent;
            border-bottom-color: #2563eb;
          }
        }
      </style>
    </head>
    <body>
      <div id="exam-container">
        <div id="timer">Time Remaining: ${exam.duration || '60'}:00</div>
        
        <div class="nav-panel">
          <div class="header">
            <h2>${exam.name || 'Exam'}</h2>
            <p><strong>Duration:</strong> ${exam.duration || '60'} minutes</p>
          </div>
          <ul class="nav-list">
            <li class="nav-item active" data-section="mcq">Multiple Choice Questions</li>
            <li class="nav-item" data-section="truefalse">True / False Questions</li>
            <li class="nav-item" data-section="shortanswer">Short Answer Questions</li>
            <li class="nav-item" data-section="essay">Essay Type Questions</li>
          </ul>
        </div>
        
        <div class="content-panel">
          <div class="section active" id="mcq-section">
            <h2 class="section-title">Multiple Choice Questions</h2>
            ${groupedQuestions.mcq.length > 0 ? groupedQuestions.mcq.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div class="options">
                  ${(q.options || []).map((option, optIdx) => `
                    <div class="option">
                      <label>
                        <input type="radio" name="q${idx}" value="${option}" />
                        ${option}
                      </label>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('') : '<div class="no-questions-message">No multiple choice questions available</div>'}
          </div>
          
          <div class="section" id="truefalse-section">
            <h2 class="section-title">True / False Questions</h2>
            ${groupedQuestions.truefalse.length > 0 ? groupedQuestions.truefalse.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div class="options">
                  <div class="option">
                    <label>
                      <input type="radio" name="tf${idx}" value="true" />
                      True
                    </label>
                  </div>
                  <div class="option">
                    <label>
                      <input type="radio" name="tf${idx}" value="false" />
                      False
                    </label>
                  </div>
                </div>
              </div>
            `).join('') : '<div class="no-questions-message">No true/false questions available</div>'}
          </div>
          
          <div class="section" id="shortanswer-section">
            <h2 class="section-title">Short Answer Questions</h2>
            ${groupedQuestions.shortanswer.length > 0 ? groupedQuestions.shortanswer.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div>
                  <input type="text" id="sa${idx}" placeholder="Enter your answer here..." />
                  <button type="button" class="upload-btn" onclick="initiateImageUpload('sa${idx}', 'shortanswer')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                      <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3h4v-.5a2.5 2.5 0 0 1 5 0V3h4a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H8v-.5a1.5 1.5 0 1 0-3 0V2H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                    </svg>
                    Upload Image
                  </button>
                </div>
              </div>
            `).join('') : '<div class="no-questions-message">No short answer questions available</div>'}
          </div>
          
          <div class="section" id="essay-section">
            <h2 class="section-title">Essay Type Questions</h2>
            ${groupedQuestions.essay.length > 0 ? groupedQuestions.essay.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div>
                  <textarea id="essay${idx}" placeholder="Write your answer here..."></textarea>
                  <button type="button" class="upload-btn" onclick="initiateImageUpload('essay${idx}', 'essay')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                      <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3h4v-.5a2.5 2.5 0 0 1 5 0V3h4a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H8v-.5a1.5 1.5 0 1 0-3 0V2H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                    </svg>
                    Upload Image
                  </button>
                </div>
              </div>
            `).join('') : '<div class="no-questions-message">No essay questions available</div>'}
          </div>
          
          <div class="actions">
            <button type="button" id="submit-btn" onclick="submitExam()">Submit Exam</button>
          </div>
        </div>
      </div>
      
      <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
      
      <script>
        // Log the exam data to help with debugging
        console.log("Exam questions loaded:", ${JSON.stringify(uniqueQuestions.length)} + " questions");
        
        // Store exam information
        const examData = {
          examId: "${exam.id || ''}",
          examName: "${exam.name || 'Exam'}",
          date: new Date().toISOString(),
          answers: {},
          timeTaken: "",
          questionTypes: ${JSON.stringify(questionTypes)},
          questionWeights: ${JSON.stringify(questionWeights)},
          questions: ${JSON.stringify(uniqueQuestions.map(q => ({
            question: q.text || '',
            type: q.type || 'unknown',
            options: q.options || [],
            answer: q.correctAnswer || ''
          })))}
        };
        
        // Timer functionality
        let startTime = ${startTime};
        let endTime = ${endTime};
        const timerElement = document.getElementById('timer');
        
        // Update the timer every second
        const timerInterval = setInterval(updateTimer, 1000);
        
        function updateTimer() {
          const now = Date.now();
          const timeLeft = endTime - now;
          
          if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitExam(true);
            return;
          }
          
          // Format time remaining
          const minutes = Math.floor(timeLeft / 60000);
          const seconds = Math.floor((timeLeft % 60000) / 1000);
          timerElement.textContent = \`Time Remaining: \${minutes}:\${seconds < 10 ? '0' : ''}\${seconds}\`;
          
          // Add warning classes as time gets low
          if (timeLeft < 300000) { // Less than 5 minutes
            timerElement.className = 'danger';
          } else if (timeLeft < 600000) { // Less than 10 minutes
            timerElement.className = 'warning';
          }
        }
        
        // Section navigation
        const navItems = document.querySelectorAll('.nav-item');
        const sections = document.querySelectorAll('.section');
        
        navItems.forEach(item => {
          item.addEventListener('click', function() {
            // Remove active class from all nav items and sections
            navItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked nav item
            this.classList.add('active');
            
            // Show corresponding section
            const sectionId = this.getAttribute('data-section') + '-section';
            document.getElementById(sectionId).classList.add('active');
          });
        });
        
        // Handle image upload
        let currentInputId = null;
        let currentInputType = null;
        
        function initiateImageUpload(inputId, type) {
          currentInputId = inputId;
          currentInputType = type;
          document.getElementById('image-upload-input').click();
        }
        
        document.getElementById('image-upload-input').addEventListener('change', async function(e) {
          if (!e.target.files || !e.target.files[0]) return;
          
          const file = e.target.files[0];
          
          // Convert to base64
          const reader = new FileReader();
          reader.onload = function(event) {
            const base64 = event.target.result.toString().split(',')[1];
            
            // Show loading state
            const inputElement = document.getElementById(currentInputId);
            const originalValue = inputElement.value;
            inputElement.value = "Processing image...";
            inputElement.disabled = true;
            
            // Send to parent window for OCR
            window.opener.postMessage({
              type: 'extractText',
              imageBase64: base64,
              questionId: currentInputId
            }, "*");
            
            // Listen for response
            window.addEventListener('message', function extractTextHandler(evt) {
              if (evt.data && evt.data.type === 'textExtracted' && evt.data.questionId === currentInputId) {
                // Update input with extracted text
                inputElement.value = evt.data.text;
                inputElement.disabled = false;
                
                // Save the answer
                saveAnswer(currentInputId, evt.data.text);
                
                // Remove this specific event listener
                window.removeEventListener('message', extractTextHandler);
              }
            });
          };
          reader.readAsDataURL(file);
          
          // Reset file input
          e.target.value = '';
        });
        
        // Collect answers
        function saveAnswer(questionId, value) {
          examData.answers[questionId] = value;
        }
        
        // Form submission
        function submitExam(autoSubmit = false) {
          clearInterval(timerInterval);
          
          // Collect all answers from inputs
          document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            saveAnswer(radio.name, radio.value);
          });
          
          document.querySelectorAll('input[type="text"]').forEach(input => {
            if (input.value.trim()) {
              saveAnswer(input.id, input.value);
            }
          });
          
          document.querySelectorAll('textarea').forEach(textarea => {
            if (textarea.value.trim()) {
              saveAnswer(textarea.id, textarea.value);
            }
          });
          
          // Calculate time taken
          const endTime = Date.now();
          const timeTaken = formatElapsedTime(startTime, endTime);
          examData.timeTaken = timeTaken;
          
          // Save results to localStorage
          localStorage.setItem('completedExamId', examData.examId);
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          
          // Try to send a message to the parent window
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'examCompleted', 
                examData 
              }, '*');
            }
          } catch (error) {
            console.error("Error sending exam data to parent:", error);
          }
          
          // Show submission message
          document.body.innerHTML = \`
            <div style="max-width: 600px; margin: 100px auto; text-align: center; padding: 20px;">
              <h1>Exam Submitted</h1>
              <p>Thank you for completing the exam "${exam.name || 'Exam'}".</p>
              <p>Time taken: \${timeTaken}</p>
              \${autoSubmit ? '<p><strong>Note:</strong> The exam was automatically submitted as the time limit was reached.</p>' : ''}
              <p>Your responses have been recorded. You can close this window now.</p>
              <button onclick="window.close()" style="margin-top: 20px;">Close Window</button>
            </div>
          \`;
          
          // Close the window after a delay
          setTimeout(() => {
            window.close();
          }, 5000);
        }
        
        // Format time function
        function formatElapsedTime(start, end) {
          const elapsed = end - start;
          const minutes = Math.floor(elapsed / 60000);
          const seconds = Math.floor((elapsed % 60000) / 1000);
          return \`\${minutes} minutes and \${seconds} seconds\`;
        }
        
        // Handle before unload to warn about leaving
        window.addEventListener('beforeunload', function(e) {
          // Don't warn if exam is already submitted
          if (!localStorage.getItem('completedExamId')) {
            e.preventDefault();
            e.returnValue = '';
            return '';
          }
        });
      </script>
    </body>
    </html>
  `;
};

// Export functions for use in other modules
export { parseQuestions };

