import React from 'react';
import { IExam } from '@/components/ExamTabs';

// Interface for parsed question
export interface ParsedQuestion {
  id: number;
  text: string;
  type: 'mcq' | 'shortAnswer' | 'essay' | 'trueFalse' | 'unknown';
  options?: string[];
  correctAnswer?: string;
  weight?: number;
}

// Parse questions from text content
export const parseQuestions = (questionsText: string): ParsedQuestion[] => {
  const questions: ParsedQuestion[] = [];
  
  // Split by question numbers (1., 2., etc.)
  const questionRegex = /(\d+\.)(.*?)(?=\d+\.|$)/gs;
  let match;
  
  while ((match = questionRegex.exec(questionsText)) !== null) {
    const questionNumber = parseInt(match[1]);
    const questionContent = match[2].trim();
    
    // Determine question type
    let type: ParsedQuestion['type'] = 'unknown';
    let options: string[] = [];
    let correctAnswer: string | undefined;
    
    // Check for multiple choice options (A), B), etc.)
    const optionMatches = questionContent.match(/([A-D])[).]\s*(.*?)(?=(?:[A-D][).]|Answer:|$))/gs);
    
    if (optionMatches && optionMatches.length > 1) {
      type = 'mcq';
      options = optionMatches.map(opt => opt.trim());
      
      // Look for correct answer
      const answerMatch = questionContent.match(/Answer:\s*([A-D])/i);
      if (answerMatch) {
        correctAnswer = answerMatch[1];
      }
    } 
    // Check for true/false questions
    else if (questionContent.toLowerCase().includes('true or false') || 
             questionContent.toLowerCase().includes('true/false')) {
      type = 'trueFalse';
      
      // Look for correct answer
      const answerMatch = questionContent.match(/Answer:\s*(True|False)/i);
      if (answerMatch) {
        correctAnswer = answerMatch[1];
      }
    }
    // Check for short answer questions
    else if (questionContent.toLowerCase().includes('short answer') || 
             questionContent.toLowerCase().includes('briefly explain') ||
             questionContent.toLowerCase().includes('in a few sentences')) {
      type = 'shortAnswer';
    }
    // Check for essay questions
    else if (questionContent.toLowerCase().includes('essay') || 
             questionContent.toLowerCase().includes('write an essay') ||
             questionContent.toLowerCase().includes('in detail') ||
             questionContent.toLowerCase().includes('word limit')) {
      type = 'essay';
    }
    
    // Extract weight if present (e.g., "(5 points)")
    let weight: number | undefined;
    const weightMatch = questionContent.match(/\((\d+)\s*points?\)/i);
    if (weightMatch) {
      weight = parseInt(weightMatch[1]);
    }
    
    questions.push({
      id: questionNumber,
      text: questionContent,
      type,
      options,
      correctAnswer,
      weight
    });
  }
  
  return questions;
};

// Generate HTML for the exam
export const generateExamHtml = (exam: IExam, questions: ParsedQuestion[]): string => {
  // Create question numbers for the left panel
  const questionNumbersHtml = questions.map((question) => {
    return `
      <div class="question-number" onclick="scrollToQuestion(${question.id})">
        <span>${question.id}</span>
      </div>
    `;
  }).join('');
  
  // Create question content for the right panel
  const questionsHtml = questions.map((question) => {
    let optionsHtml = '';
    
    if (question.type === 'mcq' && question.options) {
      optionsHtml = `
        <div class="options">
          ${question.options.map(option => `
            <div class="option">
              <input type="radio" name="question-${question.id}" id="option-${question.id}-${option.charAt(0)}">
              <label for="option-${question.id}-${option.charAt(0)}">${option}</label>
            </div>
          `).join('')}
        </div>
      `;
    } else if (question.type === 'trueFalse') {
      optionsHtml = `
        <div class="options">
          <div class="option">
            <input type="radio" name="question-${question.id}" id="option-${question.id}-true">
            <label for="option-${question.id}-true">True</label>
          </div>
          <div class="option">
            <input type="radio" name="question-${question.id}" id="option-${question.id}-false">
            <label for="option-${question.id}-false">False</label>
          </div>
        </div>
      `;
    } else if (question.type === 'shortAnswer') {
      optionsHtml = `
        <div class="answer-area">
          <textarea placeholder="Enter your answer here..." rows="3"></textarea>
        </div>
      `;
    } else if (question.type === 'essay') {
      optionsHtml = `
        <div class="answer-area">
          <textarea placeholder="Write your essay here..." rows="8"></textarea>
        </div>
      `;
    }
    
    // Clean up the question text by removing the answer part
    let cleanText = question.text;
    if (question.correctAnswer) {
      cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False)/i, '');
    }
    
    return `
      <div class="question" id="question-${question.id}">
        <div class="question-header">
          <h3>Question ${question.id}${question.weight ? ` (${question.weight} points)` : ''}</h3>
        </div>
        <div class="question-content">
          <div class="question-text">${cleanText}</div>
          ${optionsHtml}
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
        
        .timer {
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #3b82f6;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .question {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .question-header {
          margin-bottom: 10px;
        }
        
        .question-content {
          margin-left: 10px;
        }
        
        .question-text {
          margin-bottom: 15px;
        }
        
        .options {
          margin-top: 15px;
        }
        
        .option {
          margin-bottom: 10px;
          padding: 10px;
          background-color: #f8fafc;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .option:hover {
          background-color: #e2e8f0;
        }
        
        .answer-area textarea {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
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
          
          .timer {
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            font-size: 14px;
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
            <h1>${exam.name || 'Exam'}</h1>
            <p>${exam.topics ? 'Topics: ' + exam.topics.join(', ') : ''}</p>
            <p>Duration: ${durationMinutes} minutes</p>
          </div>
          <div class="timer" id="exam-timer">Time remaining: ${durationMinutes}:00</div>
          ${questionsHtml}
          <button class="submit-button" onclick="submitExam()">Submit Exam</button>
        </div>
      </div>
      
      <script>
        // Track current question for navigation
        let currentQuestionIndex = 0;
        const questions = document.querySelectorAll('.question');
        const questionNumbers = document.querySelectorAll('.question-number');
        
        // Initialize with the first question active
        if (questionNumbers.length > 0) {
          questionNumbers[0].classList.add('active');
        }
        
        // Scroll to specific question
        function scrollToQuestion(questionId) {
          const question = document.getElementById('question-' + questionId);
          if (question) {
            // Update active state
            questionNumbers.forEach(num => num.classList.remove('active'));
            const index = questionId - 1;
            if (questionNumbers[index]) {
              questionNumbers[index].classList.add('active');
            }
            
            // Scroll to the question
            question.scrollIntoView({ behavior: 'smooth' });
            currentQuestionIndex = index;
          }
        }
        
        // Submit exam function
        function submitExam() {
          if (confirm('Are you sure you want to submit your exam? This action cannot be undone.')) {
            alert('Exam submitted successfully!');
            window.close();
          }
        }
        
        // Track scroll position to update active question number
        const questionContent = document.getElementById('question-content');
        questionContent.addEventListener('scroll', function() {
          const scrollPosition = questionContent.scrollTop;
          
          // Find which question is most visible
          let activeQuestionIndex = 0;
          let maxVisibility = 0;
          
          questions.forEach((question, index) => {
            const rect = question.getBoundingClientRect();
            const visibility = Math.min(rect.bottom, window.innerHeight) - 
                              Math.max(rect.top, 0);
            
            if (visibility > maxVisibility) {
              maxVisibility = visibility;
              activeQuestionIndex = index;
            }
          });
          
          // Update active state if changed
          if (activeQuestionIndex !== currentQuestionIndex) {
            questionNumbers.forEach(num => num.classList.remove('active'));
            if (questionNumbers[activeQuestionIndex]) {
              questionNumbers[activeQuestionIndex].classList.add('active');
            }
            currentQuestionIndex = activeQuestionIndex;
          }
        });
        
        // Timer functionality
        function startTimer(durationMinutes) {
          const timerElement = document.getElementById('exam-timer');
          let totalSeconds = durationMinutes * 60;
          
          const timerInterval = setInterval(() => {
            totalSeconds--;
            
            if (totalSeconds <= 0) {
              clearInterval(timerInterval);
              alert('Time is up! Your exam will be submitted automatically.');
              submitExam();
              return;
            }
            
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            
            timerElement.textContent = 'Time remaining: ' + 
              minutes.toString().padStart(2, '0') + ':' + 
              seconds.toString().padStart(2, '0');
              
            // Warning when 5 minutes remaining
            if (totalSeconds === 300) {
              timerElement.style.backgroundColor = '#f59e0b';
              alert('5 minutes remaining!');
            }
            
            // Warning when 1 minute remaining
            if (totalSeconds === 60) {
              timerElement.style.backgroundColor = '#ef4444';
              alert('1 minute remaining!');
            }
          }, 1000);
        }
        
        // Start the timer when the page loads
        startTimer(${durationMinutes});
      </script>
    </body>
    </html>
  `;
};
