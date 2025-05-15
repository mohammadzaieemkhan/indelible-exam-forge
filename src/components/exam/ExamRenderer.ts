
// Import functions to format time and parse questions
import { formatElapsedTime } from "@/lib/utils";
import { parseQuestions } from "./utils/examParser";

// Function to generate the HTML for the exam
export const generateExamHtml = (exam: any, questions: any[]) => {
  // Create a unique ID for this exam session
  const examSessionId = `exam-session-${Date.now()}`;
  
  // Format the current time and convert the duration to milliseconds
  const startTime = Date.now();
  const durationMs = parseInt(exam.duration) * 60 * 1000;
  const endTime = startTime + durationMs;
  
  // Filter out the answer key questions (they usually have the same question number)
  const questionSet = new Set();
  const uniqueQuestions = questions.filter(q => {
    const questionNumber = q.question.match(/^\d+/);
    if (questionNumber && !questionSet.has(questionNumber[0])) {
      questionSet.add(questionNumber[0]);
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

  // HTML content for the exam
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${exam.name} - Exam</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        #exam-container {
          position: relative;
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
          margin-bottom: 30px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 20px;
        }
        .question-container {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
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
        input[type="radio"] {
          margin-top: 4px;
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
      </style>
    </head>
    <body>
      <div id="exam-container">
        <div id="timer">Time Remaining: ${exam.duration}:00</div>
        
        <div class="header">
          <h1>${exam.name}</h1>
          <p><strong>Duration:</strong> ${exam.duration} minutes</p>
          <p><strong>Topics:</strong> ${exam.topics.join(", ")}</p>
          <p><strong>Difficulty:</strong> ${exam.difficulty}</p>
        </div>
        
        <form id="exam-form">
          ${uniqueQuestions.map((q, idx) => `
            <div class="question-container">
              <div class="question">${q.question}</div>
              ${q.type === 'mcq' ? `
                <div class="options">
                  ${q.options.map((option: string, optIdx: number) => `
                    <div class="option">
                      <input type="radio" id="q${idx}-opt${optIdx}" name="q${idx}" value="${option}" />
                      <label for="q${idx}-opt${optIdx}">${option}</label>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <textarea name="q${idx}" placeholder="Type your answer here..."></textarea>
              `}
            </div>
          `).join('')}
          
          <div class="actions">
            <button type="submit" id="submit-btn">Submit Exam</button>
          </div>
        </form>
      </div>
      
      <script>
        // Store exam information
        const examData = {
          examId: "${exam.id}",
          examName: "${exam.name}",
          date: new Date().toISOString(),
          answers: {},
          timeTaken: "",
          questionTypes: ${JSON.stringify(questionTypes)},
          questionWeights: ${JSON.stringify(questionWeights)},
          questions: ${JSON.stringify(uniqueQuestions.map(q => ({
            question: q.question,
            type: q.type || 'unknown',
            options: q.options || [],
            answer: q.answer || ''
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
        
        // Form submission
        document.getElementById('exam-form').addEventListener('submit', function(e) {
          e.preventDefault();
          submitExam();
        });
        
        function submitExam(autoSubmit = false) {
          clearInterval(timerInterval);
          
          // Calculate time taken
          const endTime = Date.now();
          const timeTaken = formatElapsedTime(startTime, endTime);
          examData.timeTaken = timeTaken;
          
          // Collect all answers
          const formData = new FormData(document.getElementById('exam-form'));
          for (const [name, value] of formData.entries()) {
            examData.answers[name] = value;
          }
          
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
          document.getElementById('exam-container').innerHTML = \`
            <div class="header">
              <h1>Exam Submitted</h1>
              <p>Thank you for completing the exam "${exam.name}".</p>
              <p>Time taken: \${timeTaken}</p>
              \${autoSubmit ? '<p><strong>Note:</strong> The exam was automatically submitted as the time limit was reached.</p>' : ''}
              <p>Your responses have been recorded. You can close this window now.</p>
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
