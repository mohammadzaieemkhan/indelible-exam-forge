import { formatExamWithLayout } from "./utils/examParser";
import { parseQuestions } from "./utils/examParser";
import { ParsedQuestion, ExamSubmissionData } from "./types/examTypes";
import { generateExamHtml } from "./ExamRenderer";

// This function will be used instead of the original ExamRenderer
// when we want the two-panel layout
export const renderExamWithNumbersPanel = (exam) => {
  console.log("Rendering exam with numbers panel:", exam);
  // Create a version of the exam without answers for display
  const examWithoutAnswers = { ...exam };
  
  // Parse questions if they are provided as a string
  let parsedQuestions = [];
  if (typeof examWithoutAnswers.questions === 'string') {
    console.log("Parsing questions from string format");
    parsedQuestions = parseQuestions(examWithoutAnswers.questions);
    
    // Create question objects without answers
    const questionsWithoutAnswers = parsedQuestions.map(question => {
      // Create a clean version of the question without the answer part
      let cleanText = question.text;
      if (question.correctAnswer) {
        // Remove "Answer: X" parts from the text
        cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False|.*?)(?=\n|\r|$)/gi, '');
      }
      
      return {
        ...question,
        text: cleanText,
        // Remove correctAnswer from what's displayed to students
        correctAnswer: undefined
      };
    });
    
    // Replace the string questions with the parsed array without answers
    examWithoutAnswers.questions = questionsWithoutAnswers;
  } 
  // If questions are already in array format, clean them up
  else if (Array.isArray(examWithoutAnswers.questions)) {
    console.log("Processing questions already in array format");
    const questionsWithoutAnswers = examWithoutAnswers.questions.map(question => {
      if (!question) return null; // Handle null or undefined questions
      
      // Create a clean version of the question without the answer part
      let cleanText = question.text;
      if (question.correctAnswer) {
        // Remove "Answer: X" parts from the text
        cleanText = cleanText.replace(/Answer:\s*([A-D]|True|False|.*?)(?=\n|\r|$)/gi, '');
      }
      
      return {
        ...question,
        text: cleanText,
        // Remove correctAnswer from what's displayed to students
        correctAnswer: undefined
      };
    }).filter(q => q !== null); // Filter out any null questions
    
    examWithoutAnswers.questions = questionsWithoutAnswers;
  }
  // If questions property is neither a string nor an array, create an empty array
  else {
    console.warn("Exam questions format is invalid. Expected string or array.");
    examWithoutAnswers.questions = [];
    parsedQuestions = [];
  }
  
  // Handle custom distribution if provided
  if (exam.questionDistribution && typeof exam.questionDistribution === 'object') {
    console.log("Custom question distribution detected:", exam.questionDistribution);
    
    // Get the questions that will be used for the actual exam based on distribution
    const distributedQuestions = applyCustomDistribution(
      examWithoutAnswers.questions || [],
      exam.questionDistribution
    );
    
    console.log(`Applied custom distribution: ${distributedQuestions.length} questions selected`);
    examWithoutAnswers.questions = distributedQuestions;
  }
  
  // Keep original questions for evaluation
  // If we parsed them from a string, use the parsed questions
  // Otherwise, use the original questions array
  const originalQuestions = typeof exam.questions === 'string' 
    ? parseQuestions(exam.questions)
    : exam.questions;
  
  console.log("Original questions for evaluation:", originalQuestions);
  console.log("Clean questions for display:", examWithoutAnswers.questions);
  
  // Use the enhanced ExamRenderer to generate HTML with the two-panel layout
  const examHtml = generateExamHtml(examWithoutAnswers, examWithoutAnswers.questions || []);
  
  // This function mimics what handleViewExam does but uses our enhanced renderer
  const openExamWindow = () => {
    const examWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');
    
    if (!examWindow) {
      console.error("Popup blocked");
      return false;
    }
    
    // Add a script to pass exam completion data back to the parent window
    const completionScript = `
      <script>
        function submitExam(examData) {
          console.log("Submitting exam data:", examData);
          
          // Store the data in localStorage as backup
          localStorage.setItem('lastExamResults', JSON.stringify(examData));
          localStorage.setItem('completedExamId', examData.examId);
          
          // Add a div for showing submission results
          if (!document.getElementById('submission-result')) {
            const resultDiv = document.createElement('div');
            resultDiv.id = 'submission-result';
            resultDiv.style.position = 'fixed';
            resultDiv.style.top = '50%';
            resultDiv.style.left = '50%';
            resultDiv.style.transform = 'translate(-50%, -50%)';
            resultDiv.style.padding = '20px';
            resultDiv.style.borderRadius = '8px';
            resultDiv.style.backgroundColor = 'white';
            resultDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            resultDiv.style.zIndex = '999';
            resultDiv.style.display = 'none';
            document.body.appendChild(resultDiv);
          }
          
          // Try to send message to parent window
          try {
            window.opener.postMessage({
              type: 'examCompleted',
              examData: examData
            }, '*');
            console.log('Sent exam completion data to parent window');
            
            // Show a success message to the user
            const resultEl = document.getElementById('submission-result');
            if (resultEl) {
              resultEl.innerHTML = '<div class="alert success" style="color: #155724; background-color: #d4edda; padding: 15px; border-radius: 4px;">Exam submitted successfully! Your exam is being evaluated, and results will be available in the Performance tab.</div>';
              resultEl.style.display = 'block';
            }

            // Close window after a short delay
            setTimeout(() => {
              window.close();
            }, 3000);
          } catch (error) {
            console.error('Failed to send message to parent window:', error);
            
            // Show an error message but note that results are still saved
            const resultEl = document.getElementById('submission-result');
            if (resultEl) {
              resultEl.innerHTML = '<div class="alert warning" style="color: #856404; background-color: #fff3cd; padding: 15px; border-radius: 4px;">Connection issue, but your results are saved. You can close this window.</div>';
              resultEl.style.display = 'block';
            }
          }
        }
      </script>
    `;
    
    // Write content to the new window with the completion script
    examWindow.document.open();
    examWindow.document.write(completionScript + examHtml);
    examWindow.document.close();
    
    // Request fullscreen after a short delay
    setTimeout(() => {
      try {
        const examElement = examWindow.document.getElementById('exam-container');
        if (examElement && examElement.requestFullscreen) {
          examElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
          });
        }
      } catch (error) {
        console.error("Could not enter fullscreen mode:", error);
      }
    }, 1000);
    
    return true;
  };
  
  return { openExamWindow };
};

// Helper function to apply custom distribution to questions
function applyCustomDistribution(questions, distribution) {
  if (!questions || questions.length === 0) {
    console.warn("No questions to distribute");
    return [];
  }
  
  // Group questions by type
  const questionsByType = {};
  questions.forEach(question => {
    const type = question.type || 'mcq'; // Default to mcq if no type
    if (!questionsByType[type]) {
      questionsByType[type] = [];
    }
    questionsByType[type].push(question);
  });
  
  console.log("Questions grouped by type:", Object.keys(questionsByType).map(type => 
    `${type}: ${questionsByType[type].length} questions`
  ));
  
  // Create a new array with the specified distribution
  const distributedQuestions = [];
  
  // Process each question type according to distribution
  Object.keys(distribution).forEach(type => {
    const count = distribution[type];
    const availableQuestions = questionsByType[type] || [];
    
    if (availableQuestions.length === 0) {
      console.warn(`No questions available for type: ${type}`);
      return;
    }
    
    // If we have fewer questions than requested, use them all
    const selectedQuestions = availableQuestions.length <= count ? 
      [...availableQuestions] : 
      // Otherwise, select random questions up to the count
      shuffleAndSelect(availableQuestions, count);
    
    console.log(`Selected ${selectedQuestions.length} questions of type ${type}`);
    distributedQuestions.push(...selectedQuestions);
  });
  
  // If no questions were selected using distribution, return all questions
  if (distributedQuestions.length === 0) {
    console.warn("Distribution resulted in zero questions, using all available questions");
    return questions;
  }
  
  // Assign sequential IDs to questions
  return distributedQuestions.map((q, idx) => ({
    ...q,
    id: idx + 1
  }));
}

// Helper function to shuffle an array and select n elements
function shuffleAndSelect(array, n) {
  // Create a copy of the array
  const shuffled = [...array];
  
  // Fisher-Yates shuffle algorithm
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return the first n elements
  return shuffled.slice(0, n);
}
