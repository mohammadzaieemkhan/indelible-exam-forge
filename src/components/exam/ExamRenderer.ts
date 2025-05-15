
import { IExam } from "@/components/ExamTabs";

// Function to parse questions from raw exam text
export function parseQuestions(rawExam: string) {
  // Extract questions and answers
  const questions: Array<{
    question: string;
    type: string;
    options?: string[];
    answer?: string;
  }> = [];

  try {
    // Split by line breaks and process
    const lines = rawExam.split("\n");
    let currentQuestion = "";
    let currentOptions: string[] = [];
    let questionNumber = 0;
    let questionType = "unknown";
    let collectingOptions = false;
    let collectingAnswer = false;
    let answers: Record<string, string> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if we've reached the answers section
      if (line.toLowerCase().includes("correct answers") || line.toLowerCase().includes("answer key")) {
        collectingAnswer = true;
        continue;
      }

      // Process based on current mode
      if (collectingAnswer) {
        // Extract answer information
        const answerMatch = line.match(/(\d+)[.:]?\s*([A-D]|true|false|.+)/i);
        if (answerMatch) {
          const qNum = parseInt(answerMatch[1]);
          const ans = answerMatch[2].trim();
          answers[qNum - 1] = ans; // Store 0-indexed
        }
      } else {
        // Check for new question markers
        const questionMatch = line.match(/^\s*(\d+)[\.)]\s*(.+)/);
        
        if (questionMatch || i === lines.length - 1) {
          // Save the previous question if there is one
          if (currentQuestion) {
            // Determine question type based on content
            if (currentOptions.length > 0) {
              questionType = "mcq";
            } else if (currentQuestion.toLowerCase().includes("true or false") || 
                      currentQuestion.toLowerCase().includes("true/false")) {
              questionType = "trueFalse";
            } else if (currentQuestion.toLowerCase().includes("essay") || 
                      currentQuestion.toLowerCase().includes("explain") ||
                      currentQuestion.toLowerCase().includes("discuss")) {
              questionType = "essay";
            } else {
              questionType = "shortAnswer";
            }

            questions.push({
              question: currentQuestion,
              type: questionType,
              options: currentOptions.length > 0 ? currentOptions : undefined,
              answer: answers[questionNumber] || undefined
            });
          }

          // Start a new question
          if (questionMatch) {
            questionNumber = parseInt(questionMatch[1]) - 1; // 0-indexed
            currentQuestion = questionMatch[2];
            currentOptions = [];
            collectingOptions = true;
            questionType = "unknown"; // Reset question type for the new question
          }
        } else if (collectingOptions) {
          // Try to detect multiple choice options
          const optionMatch = line.match(/^\s*([A-D])[\.)]\s*(.+)/);
          if (optionMatch) {
            currentOptions.push(optionMatch[2].trim());
          } else if (line.trim()) {
            // If the line isn't empty and doesn't match an option format,
            // append it to the current question
            if (currentQuestion) {
              currentQuestion += " " + line;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error parsing exam questions:", error);
  }

  return questions;
}

// Function to generate HTML for the exam window
export function generateExamHtml(exam: IExam, questions: any[]) {
  const durationInMinutes = parseInt(exam.duration);
  
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${exam.name}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          padding: 20px;
          max-width: 900px;
          margin: 0 auto;
          background-color: #f9fafb;
        }
        
        h1 {
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .timer {
          font-size: 1.2rem;
          color: #111827;
          padding: 10px;
          margin-bottom: 20px;
          text-align: center;
          border-radius: 6px;
          background-color: #f3f4f6;
          display: flex;
          justify-content: center;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .timer.warning {
          background-color: #fef2f2;
          color: #b91c1c;
        }
        
        .question {
          padding: 15px;
          margin: 15px 0;
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
        }
        
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .question-number {
          font-weight: bold;
        }

        .question-type {
          color: #6b7280;
          font-size: 0.875rem;
          background-color: #f3f4f6;
          padding: 3px 8px;
          border-radius: 12px;
        }
        
        .option {
          display: flex;
          align-items: flex-start;
          margin: 10px 0;
        }
        
        .option input {
          margin-right: 10px;
          margin-top: 3px;
        }
        
        textarea {
          width: 100%;
          min-height: 120px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .submit-btn {
          display: block;
          width: 100%;
          padding: 10px;
          margin: 30px auto;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .submit-btn:hover {
          background-color: #1d4ed8;
        }
        
        .controls {
          position: sticky;
          bottom: 0;
          background-color: rgba(255, 255, 255, 0.9);
          padding: 15px;
          border-top: 1px solid #e5e7eb;
          margin-top: 30px;
        }

        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
        }
      </style>
    </head>
    <body>
      <h1>${exam.name}</h1>
      <div class="timer" id="timer">Time remaining: <span id="time-display">${durationInMinutes}:00</span></div>

      <div id="exam-container">
        <form id="exam-form">
          ${questions.map((q, index) => {
            let questionHtml = `
              <div class="question" id="q${index}-container">
                <div class="question-header">
                  <span class="question-number">Question ${index + 1}</span>
                  <span class="question-type">${
                    q.type === "mcq" 
                      ? "Multiple Choice" 
                      : q.type === "trueFalse" 
                        ? "True/False" 
                        : q.type === "essay" 
                          ? "Essay" 
                          : "Short Answer"
                  }</span>
                </div>
                <p>${q.question}</p>`;

            if (q.type === "mcq" && q.options && q.options.length > 0) {
              // Multiple choice question
              questionHtml += q.options.map((option: string, optIndex: number) => `
                <div class="option">
                  <input type="radio" id="q${index}-opt${optIndex}" name="q${index}" value="${String.fromCharCode(65 + optIndex)}">
                  <label for="q${index}-opt${optIndex}">${String.fromCharCode(65 + optIndex)}. ${option}</label>
                </div>`
              ).join('');
            } else if (q.type === "trueFalse") {
              // True/False question
              questionHtml += `
                <div class="option">
                  <input type="radio" id="q${index}-true" name="q${index}" value="true">
                  <label for="q${index}-true">True</label>
                </div>
                <div class="option">
                  <input type="radio" id="q${index}-false" name="q${index}" value="false">
                  <label for="q${index}-false">False</label>
                </div>`;
            } else if (q.type === "essay" || q.type === "shortAnswer") {
              // Text entry questions
              questionHtml += `
                <textarea id="q${index}" name="q${index}" placeholder="Your answer here..."></textarea>`;
            }

            questionHtml += '</div>';
            return questionHtml;
          }).join('')}

          <div class="controls">
            <button type="button" class="submit-btn" id="submit-exam">Submit Exam</button>
          </div>
        </form>
      </div>

      <script>
        // Timer functionality
        let durationMinutes = ${durationInMinutes};
        let totalSeconds = durationMinutes * 60;
        let timerInterval;
        let autoSubmitWarningShown = false;
        
        function formatTime(seconds) {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          return \`\${mins}:\${secs < 10 ? '0' : ''}\${secs}\`;
        }
        
        function updateTimer() {
          if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            document.getElementById('time-display').textContent = "0:00";
            submitExam();
            return;
          }
          
          totalSeconds -= 1;
          document.getElementById('time-display').textContent = formatTime(totalSeconds);
          
          // Warning when 5 minutes remaining
          if (totalSeconds === 300) {
            const timerElement = document.getElementById('timer');
            timerElement.classList.add('warning');
            timerElement.textContent = "⚠️ 5 minutes remaining! ⚠️";
            setTimeout(() => {
              timerElement.textContent = "Time remaining: " + formatTime(totalSeconds);
              timerElement.classList.add('warning');
            }, 3000);
          }
          
          // Warning when 1 minute remaining
          if (totalSeconds === 60) {
            const timerElement = document.getElementById('timer');
            timerElement.textContent = "⚠️ 1 MINUTE REMAINING! ⚠️";
            timerElement.classList.add('warning');
          }
          
          // Warning 10 seconds before auto-submit
          if (totalSeconds === 10 && !autoSubmitWarningShown) {
            autoSubmitWarningShown = true;
            alert("Exam will be auto-submitted in 10 seconds!");
          }
        }
        
        // Start the timer immediately
        timerInterval = setInterval(updateTimer, 1000);
        
        // Function to collect answers
        function collectAnswers() {
          const form = document.getElementById('exam-form');
          const formData = new FormData(form);
          const answers = {};
          
          // Process all form fields
          for (let [name, value] of formData.entries()) {
            answers[name] = value;
          }
          
          // Also check for radio buttons that might not be selected
          const questions = ${JSON.stringify(questions)};
          questions.forEach((q, index) => {
            const fieldName = \`q\${index}\`;
            if (!answers[fieldName]) {
              answers[fieldName] = '';
            }
          });
          
          return answers;
        }
        
        // Function to submit the exam
        function submitExam() {
          // Stop the timer
          clearInterval(timerInterval);
          
          // Collect answers
          const answers = collectAnswers();
          
          // Calculate time taken
          const timeSpent = (${durationInMinutes} * 60) - totalSeconds;
          const timeTaken = formatTime(timeSpent);
          
          // Prepare the data to send back
          const examData = {
            type: 'examCompleted',
            examData: {
              examId: '${exam.id}',
              examName: '${exam.name}',
              date: new Date().toISOString(),
              answers: answers,
              timeTaken: timeTaken,
              questionTypes: ${JSON.stringify(questions.map(q => q.type))},
              questionWeights: ${JSON.stringify(exam.questionWeights || {})},
              questions: ${JSON.stringify(questions)}
            }
          };
          
          // Store the results in localStorage (as backup)
          localStorage.setItem('completedExamId', '${exam.id}');
          localStorage.setItem('lastExamResults', JSON.stringify(examData.examData));
          
          // Send the results back to the parent window
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(examData, '*');
            alert("Your exam has been submitted successfully. You can close this window.");
            setTimeout(() => {
              window.close();
            }, 2000);
          } else {
            alert("Your exam has been submitted successfully! Please return to the main application.");
          }
        }
        
        // Add event listener to the submit button
        document.getElementById('submit-exam').addEventListener('click', function() {
          if (confirm('Are you sure you want to submit your exam? You cannot make changes after submission.')) {
            submitExam();
          }
        });
        
        // Prevent accidental navigation away from the exam
        window.addEventListener('beforeunload', function(e) {
          // If the exam hasn't been submitted, show a warning
          if (totalSeconds > 0) {
            e.preventDefault();
            e.returnValue = '';
            return '';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  return htmlContent;
}
