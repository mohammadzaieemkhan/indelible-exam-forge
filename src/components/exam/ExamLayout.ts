
// Custom HTML generator to create a two-panel layout with question numbers on the left
// and question content on the right

export const generateExamLayoutHtml = (title: string, questions: string[], answers: any[]): string => {
  const questionsHtml = questions.map((question, index) => {
    return `
      <div class="question" id="question-${index + 1}">
        <div class="question-content">
          ${question}
        </div>
      </div>
    `;
  }).join('');

  // Generate question numbers for the left panel
  const questionNumbersHtml = questions.map((_, index) => {
    return `
      <div class="question-number" onclick="scrollToQuestion(${index + 1})">
        <span>${index + 1}</span>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          color: #333;
          height: 100%;
          overflow: hidden;
        }
        
        #exam-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
        }
        
        #question-numbers {
          width: 80px;
          background-color: #f0f4f8;
          overflow-y: auto;
          padding: 20px 0;
          border-right: 1px solid #ddd;
          flex-shrink: 0;
        }
        
        .question-number {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 40px;
          height: 40px;
          margin: 10px auto;
          background-color: #e2e8f0;
          border-radius: 50%;
          cursor: pointer;
          font-weight: bold;
          transition: background-color 0.2s ease;
        }
        
        .question-number:hover {
          background-color: #cbd5e0;
        }
        
        .question-number.active {
          background-color: #3b82f6;
          color: white;
        }
        
        #question-content {
          flex-grow: 1;
          padding: 30px;
          overflow-y: auto;
          background-color: #ffffff;
        }
        
        .exam-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
        }
        
        .question {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .question-content {
          margin-left: 10px;
        }

        /* Style for multiple choice options */
        .question-content ul {
          list-style-type: none;
          padding-left: 10px;
        }
        
        .question-content li {
          margin-bottom: 10px;
          padding: 10px;
          background-color: #f8fafc;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .question-content li:hover {
          background-color: #e2e8f0;
        }
        
        .submit-button {
          display: block;
          width: 200px;
          padding: 12px;
          margin: 40px auto;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .submit-button:hover {
          background-color: #2563eb;
        }
        
        textarea {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
        }
        
        input[type="radio"] {
          margin-right: 10px;
        }
        
        input[type="checkbox"] {
          margin-right: 10px;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          #exam-container {
            flex-direction: column;
          }
          
          #question-numbers {
            width: 100%;
            height: 70px;
            padding: 10px 0;
            display: flex;
            overflow-x: auto;
            overflow-y: hidden;
          }
          
          .question-number {
            margin: 0 5px;
          }
          
          #question-content {
            padding: 15px;
          }
        }
      </style>
    </head>
    <body>
      <div id="exam-container">
        <div id="question-numbers">
          ${questionNumbersHtml}
        </div>
        <div id="question-content">
          <div class="exam-header">
            <h1>${title}</h1>
          </div>
          ${questionsHtml}
          <button class="submit-button" onclick="submitExam()">Submit Exam</button>
        </div>
      </div>
      
      <script>
        // Track current question for mobile navigation
        let currentQuestionIndex = 0;
        const questions = document.querySelectorAll('.question');
        const questionNumbers = document.querySelectorAll('.question-number');
        
        // Initialize with the first question active
        if (questionNumbers.length > 0) {
          questionNumbers[0].classList.add('active');
        }
        
        // Scroll to specific question
        function scrollToQuestion(questionNumber) {
          const question = document.getElementById('question-' + questionNumber);
          if (question) {
            // Update active state
            questionNumbers.forEach(num => num.classList.remove('active'));
            questionNumbers[questionNumber - 1].classList.add('active');
            
            // Scroll to the question
            question.scrollIntoView({ behavior: 'smooth' });
            currentQuestionIndex = questionNumber - 1;
          }
        }
        
        // Submit exam function - can be customized based on requirements
        function submitExam() {
          // Collect answers and submit
          if (confirm('Are you sure you want to submit your exam?')) {
            alert('Exam submitted successfully!');
            // Here you could post the data back to the parent window if needed
            window.close();
          }
        }
        
        // Track scroll position to update active question number
        const questionContent = document.getElementById('question-content');
        questionContent.addEventListener('scroll', function() {
          const scrollPosition = questionContent.scrollTop;
          let activeQuestionIndex = 0;
          
          // Find which question is most visible
          questions.forEach((question, index) => {
            const rect = question.getBoundingClientRect();
            if (rect.top < window.innerHeight / 2) {
              activeQuestionIndex = index;
            }
          });
          
          // Update active state
          if (activeQuestionIndex !== currentQuestionIndex) {
            questionNumbers.forEach(num => num.classList.remove('active'));
            questionNumbers[activeQuestionIndex].classList.add('active');
            currentQuestionIndex = activeQuestionIndex;
          }
        });
      </script>
    </body>
    </html>
  `;
};
