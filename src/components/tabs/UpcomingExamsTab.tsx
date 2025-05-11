
import { useState, useEffect } from "react";
import { Bell, FileText, Pencil, Maximize, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { IExam } from "@/components/ExamTabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onSendReminder: (exam: IExam) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  isWhatsAppSetup?: boolean;
}

interface ParsedQuestionItem {
  type: 'mcq' | 'truefalse' | 'shortanswer' | 'essay';
  question: string;
  options?: string[];
  answer?: string;
  section?: string;
}

const UpcomingExamsTab = ({ exams, onSendReminder, phoneNumber, setPhoneNumber, isWhatsAppSetup = false }: UpcomingExamsTabProps) => {
  const [selectedExamIndex, setSelectedExamIndex] = useState<string>("0");
  const { toast } = useToast();
  
  const [examContentDialogOpen, setExamContentDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  
  // Handle exam selection in upcoming exams tab
  const handleExamSelect = (value: string) => {
    setSelectedExamIndex(value);
  };
  
  // Parse questions from raw content with improved logic for better extraction
  const parseQuestions = (content: string): ParsedQuestionItem[] => {
    const questions: ParsedQuestionItem[] = [];
    const lines = content.split('\n');
    
    let currentQuestion: Partial<ParsedQuestionItem> | null = null;
    let currentOptions: string[] = [];
    let currentSection: string = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for section headers
      if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
        currentSection = trimmedLine.replace(/\*\*/g, '');
        continue;
      }
      
      // Detect questions by common patterns
      const questionRegex = /^(\d+[\.\)]|Question\s+\d+:)/i;
      if (questionRegex.test(trimmedLine)) {
        // Save the previous question if exists
        if (currentQuestion?.question) {
          questions.push({
            ...currentQuestion as ParsedQuestionItem,
            options: currentOptions.length > 0 ? [...currentOptions] : undefined,
            section: currentSection || undefined
          });
        }
        
        // Start a new question
        currentQuestion = {
          question: trimmedLine,
          type: 'mcq', // Default, we'll update based on content
          section: currentSection || undefined
        };
        currentOptions = [];
      } 
      // Detect options with improved regex
      else if (/^[A-D][\.\)]\s|^\([A-D]\)\s/i.test(trimmedLine)) {
        // Clean the option text to remove "Correct Answer" markers
        let optionText = trimmedLine.replace(/\*\*.*?\*\*/g, '').trim();
        currentOptions.push(optionText);
        if (currentQuestion) currentQuestion.type = 'mcq';
      }
      // Detect true/false questions
      else if (/true|false/i.test(trimmedLine) && currentOptions.length < 2 && currentQuestion) {
        if (trimmedLine.toLowerCase().includes('true') || trimmedLine.toLowerCase().includes('false')) {
          if (currentQuestion && !currentQuestion.question.toLowerCase().includes('true or false')) {
            currentQuestion.type = 'truefalse';
          }
        }
      }
      // Detect essay questions by keywords
      else if (/essay|explain|describe|discuss|elaborate/i.test(trimmedLine) && currentQuestion) {
        currentQuestion.type = 'essay';
      }
      // Add the line to the current question if it's a continuation
      else if (currentQuestion && trimmedLine.length > 0) {
        // Check if it contains an answer
        if (trimmedLine.toLowerCase().includes('answer:') || trimmedLine.toLowerCase().includes('*answer:')) {
          const answerMatch = trimmedLine.match(/answer:(.+)/i);
          if (answerMatch && currentQuestion) {
            currentQuestion.answer = answerMatch[1].trim();
          }
        } else {
          currentQuestion.question += ' ' + trimmedLine;
        }
      }
    }
    
    // Add the last question
    if (currentQuestion?.question) {
      questions.push({
        ...currentQuestion as ParsedQuestionItem,
        options: currentOptions.length > 0 ? [...currentOptions] : undefined,
        section: currentSection || undefined
      });
    }
    
    return questions.map(q => {
      // If no options and not already marked as essay, mark as short answer
      if (!q.options || q.options.length === 0) {
        if (q.type !== 'essay') {
          return { ...q, type: 'shortanswer' };
        }
      }
      // Look for word count guidance in essay questions
      if (q.type === 'essay' && q.question.toLowerCase().includes('word count')) {
        const wordCountMatch = q.question.match(/word count:?\s*(\d+)[-–](\d+)/i);
        if (wordCountMatch) {
          const minWords = parseInt(wordCountMatch[1]);
          const maxWords = parseInt(wordCountMatch[2]);
          q.question = `${q.question} (${minWords}-${maxWords} words)`;
        }
      }
      return q;
    });
  };
  
  // Open exam in a new window
  const handleViewExam = (exam: IExam) => {
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
    const parsedQuestions = parseQuestions(exam.questions || "");
    
    // Generate HTML content for exam
    const examContent = generateExamHtml(exam, parsedQuestions);
    
    // Write the content to the new window
    examWindow.document.open();
    examWindow.document.write(examContent);
    examWindow.document.close();
    
    // Request fullscreen after a short delay to ensure the window is fully loaded
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
  };
  
  // Generate HTML content for the exam window
  const generateExamHtml = (exam: IExam, questions: any[]) => {
    const questionHtml = questions.map((q, index) => `
      <div class="question-container" id="question-${index}">
        <h3>Question ${index + 1}${q.section ? ` (${q.section})` : ''}</h3>
        <div class="question-content">
          ${q.question}
        </div>
        <div class="answer-section">
          ${renderQuestionHtml(q, index)}
        </div>
      </div>
    `).join('');

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
            --primary-foreground: white;
            --border: #e2e8f0;
            --border-hover: #cbd5e1;
            --background: #ffffff;
            --muted: #f1f5f9;
            --muted-foreground: #64748b;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background-color: var(--background);
            margin: 0;
            padding: 0;
          }
          
          #exam-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            border-bottom: 1px solid var(--border);
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          
          .header p {
            margin: 5px 0 0 0;
            color: var(--muted-foreground);
          }
          
          .progress-container {
            margin-bottom: 30px;
          }
          
          .progress-bar {
            height: 8px;
            background-color: var(--muted);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .progress-value {
            height: 100%;
            background-color: var(--primary);
            width: 0%;
            transition: width 0.3s ease;
          }
          
          .question-container {
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 30px;
            padding: 20px;
            background-color: white;
          }
          
          .question-container h3 {
            margin-top: 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          .question-content {
            margin-bottom: 20px;
            white-space: pre-line;
          }
          
          .option {
            display: flex;
            align-items: center;
            padding: 10px;
            margin-bottom: 10px;
            border: 1px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.1s ease;
          }
          
          .option:hover {
            border-color: var(--border-hover);
            background-color: var(--muted);
          }
          
          .option input {
            margin-right: 10px;
          }
          
          .option label {
            flex-grow: 1;
            cursor: pointer;
          }
          
          .text-input, .essay-input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 16px;
            box-sizing: border-box;
          }
          
          .essay-input {
            min-height: 150px;
            resize: vertical;
          }
          
          .navigation {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
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
            transition: all 0.1s ease;
          }
          
          .button:hover {
            opacity: 0.9;
          }
          
          .button.secondary {
            background-color: var(--muted);
            color: var(--muted-foreground);
          }
          
          .buttons-row {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
          }
          
          .question-button {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            border: 1px solid var(--border);
            cursor: pointer;
            background-color: white;
          }
          
          .question-button.current {
            background-color: var(--primary);
            color: var(--primary-foreground);
            border-color: var(--primary);
          }
          
          .question-button.answered {
            background-color: #dcfce7;
            color: #166534;
            border-color: #86efac;
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
          }
          
          @media (max-width: 768px) {
            #exam-container {
              padding: 15px;
            }
            
            .question-container {
              padding: 15px;
            }
          }
        </style>
      </head>
      <body>
        <div id="exam-container">
          <div class="header">
            <h1>${exam.name}</h1>
            <p>${exam.date} at ${exam.time} • ${exam.duration} minutes</p>
          </div>
          
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-value" id="progress-bar"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 14px; color: var(--muted-foreground);">
              <span id="progress-text">0 of ${questions.length} answered</span>
              <span id="progress-percentage">0%</span>
            </div>
          </div>
          
          <div class="buttons-row" id="question-buttons">
            ${questions.map((_, i) => `
              <button class="question-button${i === 0 ? ' current' : ''}" 
                id="button-${i}" 
                onclick="showQuestion(${i})">${i + 1}</button>
            `).join('')}
          </div>
          
          ${questionHtml}
          
          <div class="navigation">
            <button class="button secondary" id="prev-button" onclick="prevQuestion()">Previous</button>
            <button class="button secondary" id="next-button" onclick="nextQuestion()">Next</button>
            <button class="button" id="submit-button" onclick="submitExam()">Submit Exam</button>
          </div>
        </div>
        
        <button class="fullscreen-button" id="fullscreen-button" title="Toggle fullscreen">
          <svg class="fullscreen-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
          </svg>
        </button>
        
        <script>
          let currentQuestion = 0;
          const totalQuestions = ${questions.length};
          const answers = {};
          
          // Initialize the exam
          function initExam() {
            // Hide all questions except the first one
            for (let i = 1; i < totalQuestions; i++) {
              document.getElementById('question-' + i).style.display = 'none';
            }
            
            // Setup fullscreen button
            document.getElementById('fullscreen-button').addEventListener('click', toggleFullScreen);
            
            // Enter fullscreen automatically
            setTimeout(() => {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(err => {
                  console.log('Error attempting to enable fullscreen:', err);
                });
              }
            }, 1000);
            
            // Setup answer tracking
            setupAnswerTracking();
            
            // Update navigation buttons
            updateNavButtons();
          }
          
          // Show question by index
          function showQuestion(index) {
            // Hide current question
            document.getElementById('question-' + currentQuestion).style.display = 'none';
            
            // Show the requested question
            document.getElementById('question-' + index).style.display = 'block';
            
            // Update current question class in buttons
            document.getElementById('button-' + currentQuestion).classList.remove('current');
            document.getElementById('button-' + index).classList.add('current');
            
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
          
          // Update navigation buttons state
          function updateNavButtons() {
            document.getElementById('prev-button').disabled = currentQuestion === 0;
            
            if (currentQuestion === totalQuestions - 1) {
              document.getElementById('next-button').style.display = 'none';
              document.getElementById('submit-button').style.display = 'block';
            } else {
              document.getElementById('next-button').style.display = 'block';
              document.getElementById('submit-button').style.display = 'none';
            }
          }
          
          // Setup tracking for answers
          function setupAnswerTracking() {
            // Radio buttons (MCQ and True/False)
            document.querySelectorAll('input[type="radio"]').forEach(radio => {
              radio.addEventListener('change', function() {
                const questionId = this.name.split('-')[0];
                const value = this.value;
                answers[questionId] = value;
                updateProgress();
                markQuestionAnswered(questionId.split('q')[1]);
              });
            });
            
            // Text inputs (Short answer)
            document.querySelectorAll('input[type="text"]').forEach(input => {
              input.addEventListener('change', function() {
                const questionId = this.id.split('-')[0];
                const value = this.value.trim();
                if (value) {
                  answers[questionId] = value;
                  markQuestionAnswered(questionId.split('q')[1]);
                } else {
                  delete answers[questionId];
                }
                updateProgress();
              });
            });
            
            // Textareas (Essays)
            document.querySelectorAll('textarea').forEach(textarea => {
              textarea.addEventListener('change', function() {
                const questionId = this.id.split('-')[0];
                const value = this.value.trim();
                if (value) {
                  answers[questionId] = value;
                  markQuestionAnswered(questionId.split('q')[1]);
                } else {
                  delete answers[questionId];
                }
                updateProgress();
              });
            });
          }
          
          // Mark a question button as answered
          function markQuestionAnswered(index) {
            document.getElementById('button-' + index).classList.add('answered');
          }
          
          // Update progress display
          function updateProgress() {
            const answeredCount = Object.keys(answers).length;
            const percentage = Math.round((answeredCount / totalQuestions) * 100);
            
            document.getElementById('progress-bar').style.width = percentage + '%';
            document.getElementById('progress-text').textContent = answeredCount + ' of ' + totalQuestions + ' answered';
            document.getElementById('progress-percentage').textContent = percentage + '%';
          }
          
          // Submit the exam
          function submitExam() {
            const answeredCount = Object.keys(answers).length;
            
            if (answeredCount < totalQuestions) {
              const confirm = window.confirm('You have only answered ' + answeredCount + ' out of ' + totalQuestions + ' questions. Are you sure you want to submit?');
              if (!confirm) return;
            }
            
            // Disable all inputs
            document.querySelectorAll('input, textarea').forEach(input => {
              input.disabled = true;
            });
            
            // Show completion message
            const examContainer = document.getElementById('exam-container');
            const completionMessage = document.createElement('div');
            completionMessage.className = 'question-container';
            completionMessage.innerHTML = \`
              <h3 style="text-align: center; color: #16a34a;">Exam Submitted!</h3>
              <p style="text-align: center;">Thank you for completing this exam.</p>
              <p style="text-align: center;">You can now close this window.</p>
              <div style="text-align: center; margin-top: 20px;">
                <button class="button" onclick="window.close()">Close Window</button>
              </div>
            \`;
            
            examContainer.appendChild(completionMessage);
            
            // Hide the navigation buttons
            document.querySelector('.navigation').style.display = 'none';
            
            // Save answers to localStorage (for demo purposes)
            localStorage.setItem('examAnswers-${exam.id}', JSON.stringify(answers));
            
            // You would typically send the answers to a server here
            console.log('Exam submitted:', answers);
          }
          
          // Toggle fullscreen
          function toggleFullScreen() {
            if (!document.fullscreenElement) {
              if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
              }
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen();
              }
            }
          }
          
          // Initialize when page loads
          window.onload = initExam;
        </script>
      </body>
      </html>
    `;
  };
  
  // Render HTML version of questions for the popup window
  const renderQuestionHtml = (question: any, index: number) => {
    switch (question.type) {
      case 'mcq':
        return `
          <div class="options">
            ${question.options?.map((option: string, optIdx: number) => `
              <div class="option">
                <input type="radio" name="q${index}-option" id="q${index}-opt${optIdx}" value="${option}">
                <label for="q${index}-opt${optIdx}">${option}</label>
              </div>
            `).join('') || ''}
          </div>
        `;
        
      case 'truefalse':
        return `
          <div class="options">
            <div class="option">
              <input type="radio" name="q${index}-option" id="q${index}-true" value="true">
              <label for="q${index}-true">True</label>
            </div>
            <div class="option">
              <input type="radio" name="q${index}-option" id="q${index}-false" value="false">
              <label for="q${index}-false">False</label>
            </div>
          </div>
        `;
        
      case 'shortanswer':
        return `
          <input type="text" class="text-input" id="q${index}-answer" placeholder="Your answer...">
        `;
        
      case 'essay':
        return `
          <textarea class="essay-input" id="q${index}-essay" placeholder="Write your answer here..."></textarea>
          <div style="display: flex; justify-content: flex-end; margin-top: 5px; font-size: 14px; color: var(--muted-foreground);">
            <span id="q${index}-wordcount">0 words</span>
          </div>
        `;
        
      default:
        return '';
    }
  };
  
  // Get current date for calendar view
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Month names
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Exams</CardTitle>
        <CardDescription>View and manage scheduled exams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="whatsapp-number">Your WhatsApp Number (for notifications)</Label>
          <div className="flex gap-2">
            <Input
              id="whatsapp-number"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-1" 
              onClick={() => {
                if (phoneNumber && phoneNumber.length > 5) {
                  localStorage.setItem('whatsappNumber', phoneNumber);
                  toast({
                    title: "WhatsApp Number Saved",
                    description: "Your WhatsApp number has been saved for notifications"
                  });
                } else {
                  toast({
                    title: "Invalid Number",
                    description: "Please enter a valid phone number with country code",
                    variant: "destructive"
                  });
                }
              }}
            >
              Save
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Include the country code (e.g., +1 for US)
          </p>
          
          {!isWhatsAppSetup && (
            <Alert className="mt-3">
              <Info className="h-4 w-4" />
              <AlertTitle>Important: WhatsApp Setup</AlertTitle>
              <AlertDescription>
                For WhatsApp notifications to work, you need to:
                <ol className="list-decimal list-inside mt-2 ml-2 text-sm">
                  <li>Enter your WhatsApp number with country code (like +1234567890)</li>
                  <li>Send a message to the Twilio WhatsApp number first to opt-in</li>
                </ol>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {/* Calendar Side */}
          <div className="md:col-span-5 border rounded-lg p-4">
            <div className="text-center mb-4">
              <h3 className="font-medium">{monthNames[currentMonth]} {currentYear}</h3>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Day labels */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-muted-foreground text-sm p-2">
                  {day}
                </div>
              ))}
              
              {/* Empty days from previous month */}
              {Array(firstDay).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 h-16" />
              ))}
              
              {/* Actual days */}
              {Array(daysInMonth).fill(null).map((_, i) => {
                // Check if any exams are scheduled for this day
                const dayExams = exams.filter(exam => {
                  const examDate = new Date(exam.date);
                  return examDate.getDate() === i + 1 && 
                         examDate.getMonth() === currentMonth && 
                         examDate.getFullYear() === currentYear;
                });
                
                const hasExam = dayExams.length > 0;
                
                return (
                  <div 
                    key={`day-${i+1}`}
                    className={`p-1 border rounded-md h-16 ${hasExam ? 'bg-primary/10 border-primary' : ''}`}
                  >
                    <div className="text-right text-sm">{i+1}</div>
                    {dayExams.map((exam, examIndex) => (
                      <button 
                        key={examIndex}
                        className={`text-xs p-1 mt-1 ${exam.isActive ? 'bg-green-500/20 text-green-700' : 'bg-primary/20 text-primary'} rounded w-full text-left`}
                        onClick={() => exam.isActive && handleViewExam(exam)}
                      >
                        {exam.name} {exam.isActive ? '(Available)' : ''}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Details Side */}
          <div className="md:col-span-2">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Exam Details</h3>
                {exams.length > 0 ? (
                  <Select 
                    value={selectedExamIndex} 
                    onValueChange={handleExamSelect}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Upcoming Exams</SelectLabel>
                        {exams.map((exam, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {exam.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No upcoming exams scheduled. Generate and save an exam first.
                  </p>
                )}
              </div>
              
              {exams.length > 0 && (
                <div className="border rounded-md p-4 space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.date} at {exams[parseInt(selectedExamIndex) || 0]?.time}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.duration} minutes</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.isActive ? 
                      <span className="text-green-600 font-medium">Available</span> : 
                      <span className="text-amber-600 font-medium">Scheduled</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Topics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exams[parseInt(selectedExamIndex) || 0]?.topics.map((topic, i) => (
                        <span key={i} className="bg-muted px-2 py-1 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button 
                      size="sm"
                      onClick={() => exams[parseInt(selectedExamIndex) || 0]?.isActive && 
                        handleViewExam(exams[parseInt(selectedExamIndex) || 0])}
                      disabled={!exams[parseInt(selectedExamIndex) || 0]?.isActive}
                    >
                      {exams[parseInt(selectedExamIndex) || 0]?.isActive ? 'Take Exam' : 'Not Available Yet'}
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="ml-2"
                      onClick={() => onSendReminder(exams[parseInt(selectedExamIndex) || 0])}
                    >
                      <Bell className="h-4 w-4 mr-1" /> Send Reminder
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingExamsTab;
