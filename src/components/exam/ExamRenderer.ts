
// Fix the import to use the correct path and import the new parseQuestions function
import { parseQuestions } from "./utils/examParser";
import { ParsedQuestion } from "./types/examTypes";

// Function to generate the HTML for the exam
export const generateExamHtml = (exam, questions) => {
  console.log("Generating exam HTML with questions:", questions);
  
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
  
  console.log("Grouped questions:", groupedQuestions);

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
        .essay-input {
          min-height: 200px;
        }
        .answer-save-indicator {
          display: inline-block;
          margin-left: 10px;
          font-size: 12px;
          color: #10B981;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .answer-save-indicator.visible {
          opacity: 1;
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
            ${groupedQuestions.mcq.length > 0 ? '<li class="nav-item active" data-section="mcq">Multiple Choice Questions</li>' : ''}
            ${groupedQuestions.truefalse.length > 0 ? '<li class="nav-item" data-section="truefalse">True / False Questions</li>' : ''}
            ${groupedQuestions.shortanswer.length > 0 ? '<li class="nav-item" data-section="shortanswer">Short Answer Questions</li>' : ''}
            ${groupedQuestions.essay.length > 0 ? '<li class="nav-item" data-section="essay">Essay Type Questions</li>' : ''}
          </ul>
        </div>
        
        <div class="content-panel">
          ${groupedQuestions.mcq.length > 0 ? `
          <div class="section active" id="mcq-section">
            <h2 class="section-title">Multiple Choice Questions</h2>
            ${groupedQuestions.mcq.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div class="options">
                  ${(q.options || []).map((option, optIdx) => {
                    // Extract just the option letter and text from the full option string
                    const optionLetter = option.charAt(0);
                    const optionText = option.substring(option.indexOf(')') + 1).trim();
                    
                    return `
                    <div class="option">
                      <label>
                        <input type="radio" name="q${idx}" value="${optionLetter}" data-question-id="${idx}" data-question-type="mcq" data-mcq-index="${idx}" onclick="saveAnswer('q${idx}', '${optionLetter}', 'mcq')"/>
                        ${optionText}
                      </label>
                    </div>
                  `;}).join('')}
                </div>
                <div class="answer-save-indicator" id="save-indicator-q${idx}">Answer saved</div>
              </div>
            `).join('')}
          </div>` : ''}
          
          ${groupedQuestions.truefalse.length > 0 ? `
          <div class="section ${groupedQuestions.mcq.length === 0 ? 'active' : ''}" id="truefalse-section">
            <h2 class="section-title">True / False Questions</h2>
            ${groupedQuestions.truefalse.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div class="options">
                  <div class="option">
                    <label>
                      <input type="radio" name="tf${idx}" value="true" data-question-id="${idx}" data-question-type="trueFalse" data-tf-index="${idx}" onclick="saveAnswer('tf${idx}', 'true', 'trueFalse')"/>
                      True
                    </label>
                  </div>
                  <div class="option">
                    <label>
                      <input type="radio" name="tf${idx}" value="false" data-question-id="${idx}" data-question-type="trueFalse" data-tf-index="${idx}" onclick="saveAnswer('tf${idx}', 'false', 'trueFalse')"/>
                      False
                    </label>
                  </div>
                </div>
                <div class="answer-save-indicator" id="save-indicator-tf${idx}">Answer saved</div>
              </div>
            `).join('')}
          </div>` : ''}
          
          ${groupedQuestions.shortanswer.length > 0 ? `
          <div class="section ${groupedQuestions.mcq.length === 0 && groupedQuestions.truefalse.length === 0 ? 'active' : ''}" id="shortanswer-section">
            <h2 class="section-title">Short Answer Questions</h2>
            ${groupedQuestions.shortanswer.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div>
                  <input type="text" id="sa${idx}" placeholder="Enter your answer here..." 
                    data-question-id="${idx}" data-question-type="shortAnswer" data-sa-index="${idx}"
                    oninput="saveAnswer('sa${idx}', this.value, 'shortAnswer')" 
                    onchange="saveAnswer('sa${idx}', this.value, 'shortAnswer')"
                    onblur="saveAnswer('sa${idx}', this.value, 'shortAnswer')"
                  />
                  <button type="button" class="upload-btn" onclick="initiateImageUpload('sa${idx}', 'shortanswer')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                      <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3h4v-.5a2.5 2.5 0 0 1 5 0V3h4a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H8v-.5a1.5 1.5 0 1 0-3 0V2H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                    </svg>
                    Upload Image
                  </button>
                  <div class="answer-save-indicator" id="save-indicator-sa${idx}">Answer saved</div>
                </div>
              </div>
            `).join('')}
          </div>` : ''}
          
          ${groupedQuestions.essay.length > 0 ? `
          <div class="section ${groupedQuestions.mcq.length === 0 && groupedQuestions.truefalse.length === 0 && groupedQuestions.shortanswer.length === 0 ? 'active' : ''}" id="essay-section">
            <h2 class="section-title">Essay Type Questions</h2>
            ${groupedQuestions.essay.map((q, idx) => `
              <div class="question-container">
                <div class="question">Q${idx + 1}: ${q.text || `Question ${idx + 1}`}</div>
                <div>
                  <textarea id="essay${idx}" class="essay-input" placeholder="Write your answer here..." 
                    data-question-id="${idx}" data-question-type="essay" data-essay-index="${idx}"
                    oninput="saveAnswer('essay${idx}', this.value, 'essay')" 
                    onchange="saveAnswer('essay${idx}', this.value, 'essay')"
                    onblur="saveAnswer('essay${idx}', this.value, 'essay')"
                  ></textarea>
                  <button type="button" class="upload-btn" onclick="initiateImageUpload('essay${idx}', 'essay')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
                      <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3h4v-.5a2.5 2.5 0 0 1 5 0V3h4a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H8v-.5a1.5 1.5 0 1 0-3 0V2H1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z"/>
                    </svg>
                    Upload Image
                  </button>
                  <div class="answer-save-indicator" id="save-indicator-essay${idx}">Answer saved</div>
                </div>
              </div>
            `).join('')}
          </div>` : ''}
          
          ${(groupedQuestions.mcq.length === 0 && groupedQuestions.truefalse.length === 0 && 
            groupedQuestions.shortanswer.length === 0 && groupedQuestions.essay.length === 0) ? 
            '<div class="no-questions-message">No questions available for this exam</div>' : ''}
          
          <div class="actions">
            <button type="button" id="submit-btn" onclick="submitExam()">Submit Exam</button>
          </div>
        </div>
      </div>
      
      <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
      
      <script>
        // Log the exam data to help with debugging
        console.log("Exam questions loaded:", ${JSON.stringify(uniqueQuestions.length)} + " questions");
        
        // Store correct answers for validation during submission
        const correctAnswers = {
          ${uniqueQuestions.map((q, idx) => {
            // Only include if answer is provided
            if (q.answer) {
              return `"q${idx}": "${q.answer}"`;
            }
            return '';
          }).filter(Boolean).join(',\n          ')}
        };
        
        console.log("Correct answers loaded:", correctAnswers);
        
        // Store exam information
        const examData = {
          examId: "${exam.id || ''}",
          examName: "${exam.name || 'Exam'}",
          date: new Date().toISOString(),
          answers: {},
          timeTaken: "",
          topics: ${JSON.stringify(exam.topics || [])},
          difficulty: "${exam.difficulty || 'medium'}",
          questionTypes: ${JSON.stringify(questionTypes)},
          questionWeights: ${JSON.stringify(questionWeights)},
          questions: ${JSON.stringify(uniqueQuestions.map(q => ({
            question: q.text || '',
            type: q.type || 'unknown',
            options: q.options || [],
            answer: q.answer || ''  // Include correct answers for evaluation
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
                saveAnswer(currentInputId, evt.data.text, currentInputType);
                
                // Remove this specific event listener
                window.removeEventListener('message', extractTextHandler);
              }
            });
          };
          reader.readAsDataURL(file);
          
          // Reset file input
          e.target.value = '';
        });
        
        // Show the save indicator for a brief period
        function showSaveIndicator(elementId) {
          const indicator = document.getElementById('save-indicator-' + elementId);
          if (indicator) {
            indicator.classList.add('visible');
            setTimeout(() => {
              indicator.classList.remove('visible');
            }, 1500);
          }
        }
        
        // Collect answers - completely revised for robust answer handling
        function saveAnswer(questionId, value, type) {
          console.log("Saving answer for:", questionId, "Value:", value, "Type:", type);
          
          // Show the save animation
          showSaveIndicator(questionId);
          
          // Store answers in multiple formats to ensure they're captured
          
          // First store in answers object with the ID format expected by the evaluation code
          examData.answers[questionId] = value;
          
          // Also store using additional formats based on data attributes
          if (type === 'mcq') {
            // Find the actual index from the data attribute
            const radioEl = document.querySelector(\`input[name="\${questionId}"]:checked\`);
            if (radioEl) {
              const mcqIndex = radioEl.getAttribute('data-mcq-index');
              if (mcqIndex !== null) {
                // Store with plain numeric index
                examData.answers[mcqIndex] = value;
                // Store with question- prefix
                examData.answers[\`question-\${mcqIndex}\`] = value;
              }
            }
          } else if (type === 'trueFalse') {
            const radioEl = document.querySelector(\`input[name="\${questionId}"]:checked\`);
            if (radioEl) {
              const tfIndex = radioEl.getAttribute('data-tf-index');
              if (tfIndex !== null) {
                examData.answers[tfIndex] = value;
                examData.answers[\`question-\${tfIndex}\`] = value;
              }
            }
          } else if (type === 'shortAnswer') {
            const inputEl = document.getElementById(questionId);
            if (inputEl) {
              const saIndex = inputEl.getAttribute('data-sa-index');
              if (saIndex !== null) {
                examData.answers[saIndex] = value;
                examData.answers[\`question-\${saIndex}\`] = value;
              }
            }
          } else if (type === 'essay') {
            const textareaEl = document.getElementById(questionId);
            if (textareaEl) {
              const essayIndex = textareaEl.getAttribute('data-essay-index');
              if (essayIndex !== null) {
                examData.answers[essayIndex] = value;
                examData.answers[\`question-\${essayIndex}\`] = value;
              }
            }
          }
          
          // Add visual feedback that answer was saved
          if (type === 'mcq' || type === 'trueFalse') {
            const radioEl = document.querySelector(\`input[name="\${questionId}"]:checked\`);
            if (radioEl && radioEl.parentElement) {
              radioEl.parentElement.style.backgroundColor = "#e6f7ff"; // Light blue background
            }
          } else if (type === 'shortAnswer' || type === 'essay') {
            const inputEl = document.getElementById(questionId);
            if (inputEl) {
              inputEl.style.borderColor = "#52c41a"; // Green border
            }
          }
          
          // Debug the answers state - full dump for troubleshooting
          console.log("Current answers state:", JSON.stringify(examData.answers));
          
          // Store answers in localStorage as backup
          try {
            localStorage.setItem('currentExamAnswers', JSON.stringify(examData.answers));
          } catch (e) {
            console.error("Failed to save answers to localStorage:", e);
          }
        }
        
        // Immediately initialize answer collection when page loads
        document.addEventListener('DOMContentLoaded', function() {
          console.log("DOM loaded, attaching event listeners for answers");
          
          // Load any previously saved answers from localStorage
          try {
            const savedAnswers = localStorage.getItem('currentExamAnswers');
            if (savedAnswers) {
              const parsedAnswers = JSON.parse(savedAnswers);
              // Restore answers to UI
              for (const [questionId, value] of Object.entries(parsedAnswers)) {
                // Only restore if we're in the same exam session
                if (questionId) {
                  examData.answers[questionId] = value;
                  
                  // Find the corresponding UI element and set its value
                  if (questionId.startsWith('q')) {
                    // MCQ question
                    const radioEl = document.querySelector(\`input[name="\${questionId}"][value="\${value}"]\`);
                    if (radioEl) radioEl.checked = true;
                  } else if (questionId.startsWith('tf')) {
                    // True/False question
                    const radioEl = document.querySelector(\`input[name="\${questionId}"][value="\${value}"]\`);
                    if (radioEl) radioEl.checked = true;
                  } else if (questionId.startsWith('sa') || questionId.startsWith('essay')) {
                    // Short answer or essay question
                    const inputEl = document.getElementById(questionId);
                    if (inputEl) inputEl.value = value;
                  }
                }
              }
              console.log("Restored saved answers:", examData.answers);
            }
          } catch (e) {
            console.error("Failed to restore saved answers:", e);
          }
          
          // For radio buttons (MCQ and True/False) - add multiple event types
          document.querySelectorAll('input[type="radio"]').forEach(radio => {
            ['change', 'click'].forEach(eventType => {
              radio.addEventListener(eventType, function() {
                const qId = this.getAttribute('name');
                const qType = this.getAttribute('data-question-type') || (qId.startsWith('q') ? 'mcq' : 'trueFalse');
                saveAnswer(qId, this.value, qType);
                console.log(eventType + ' event: Saved ' + qId + ' = ' + this.value);
              });
            });
          });
          
          // For text inputs (Short Answer) - add multiple event types
          document.querySelectorAll('input[type="text"]').forEach(input => {
            ['input', 'change', 'blur', 'keyup'].forEach(eventType => {
              input.addEventListener(eventType, function() {
                const qId = this.id;
                const qType = this.getAttribute('data-question-type') || 'shortAnswer';
                saveAnswer(qId, this.value, qType);
                console.log(eventType + ' event: Saved ' + qId + ' = ' + this.value);
              });
            });
          });
          
          // For textareas (Essay) - add multiple event types
          document.querySelectorAll('textarea').forEach(textarea => {
            ['input', 'change', 'blur', 'keyup'].forEach(eventType => {
              textarea.addEventListener(eventType, function() {
                const qId = this.id;
                const qType = this.getAttribute('data-question-type') || 'essay';
                saveAnswer(qId, this.value, qType);
                console.log(eventType + ' event: Saved ' + qId + ' = ' + this.value.substring(0, 20) + '...');
              });
            });
          });
          
          // Add interval to periodically save all answers as backup
          setInterval(collectAllAnswers, 10000);
        });
        
        // Collect all answers from the DOM
        function collectAllAnswers() {
          console.log("Periodically saving all answers");
          
          // For multiple choice questions
          document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            const qId = radio.getAttribute('name');
            const qType = radio.getAttribute('data-question-type') || (qId.startsWith('q') ? 'mcq' : 'trueFalse');
            saveAnswer(qId, radio.value, qType);
          });
          
          // For text inputs
          document.querySelectorAll('input[type="text"]').forEach(input => {
            if (input.value.trim()) {
              const qId = input.id;
              const qType = input.getAttribute('data-question-type') || 'shortAnswer';
              saveAnswer(qId, input.value, qType);
            }
          });
          
          // For textareas
          document.querySelectorAll('textarea').forEach(textarea => {
            if (textarea.value.trim()) {
              const qId = textarea.id;
              const qType = textarea.getAttribute('data-question-type') || 'essay';
              saveAnswer(qId, textarea.value, qType);
            }
          });
          
          // Debug the answers state
          console.log("Answers collected:", Object.keys(examData.answers).length);
        }
        
        // Form submission - enhanced to ensure answers are collected
        function submitExam(autoSubmit = false) {
          clearInterval(timerInterval);
          
          // CRITICAL: Force collect ALL answers one last time before submission
          console.log("Submitting exam - collecting final answers");
          collectAllAnswers();
          
          // Additional collection of answers using a different approach for maximum redundancy
          
          // For multiple choice questions
          document.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            const qId = radio.getAttribute('name');
            const mcqIndex = radio.getAttribute('data-mcq-index');
            const tfIndex = radio.getAttribute('data-tf-index');
            
            // Store answers in multiple formats
            if (qId) examData.answers[qId] = radio.value;
            if (mcqIndex) examData.answers[mcqIndex] = radio.value;
            if (tfIndex) examData.answers[tfIndex] = radio.value;
            
            console.log('Final collection - radio:', qId, '=', radio.value);
          });
          
          // For text inputs
          document.querySelectorAll('input[type="text"]').forEach(input => {
            if (input.value.trim()) {
              const qId = input.id;
              const saIndex = input.getAttribute('data-sa-index');
              
              // Store answers in multiple formats
              if (qId) examData.answers[qId] = input.value;
              if (saIndex) examData.answers[saIndex] = input.value;
              
              console.log('Final collection - text:', qId, '=', input.value);
            }
          });
          
          // For textareas
          document.querySelectorAll('textarea').forEach(textarea => {
            if (textarea.value.trim()) {
              const qId = textarea.id;
              const essayIndex = textarea.getAttribute('data-essay-index');
              
              // Store answers in multiple formats
              if (qId) examData.answers[qId] = textarea.value;
              if (essayIndex) examData.answers[essayIndex] = textarea.value;
              
              console.log('Final collection - textarea:', qId, '=', textarea.value.substring(0, 20) + '...');
            }
          });
          
          // Calculate time taken
          const endTime = Date.now();
          const timeTaken = formatElapsedTime(startTime, endTime);
          examData.timeTaken = timeTaken;
          
          // Debug the entire exam data object
          console.log("FINAL EXAM DATA FOR SUBMISSION:", JSON.stringify(examData));
          console.log("Answers collected:", Object.keys(examData.answers).length);
          
          // Save results to localStorage as backup
          localStorage.setItem('completedExamId', examData.examId);
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          
          // Try to send a message to the parent window
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'examCompleted', 
                examData: examData
              }, '*');
              
              console.log("Exam data sent to parent window");
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

