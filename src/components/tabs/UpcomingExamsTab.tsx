
import { useState, useEffect } from "react";
import { Bell, FileText, Pencil, Trash2, Info } from "lucide-react";
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
import { Dialog, DialogTitle, DialogContent, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onSendReminder: (exam: IExam) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  isWhatsAppSetup?: boolean;
  onDeleteExam?: (examId: string) => void;
}

interface ParsedQuestionItem {
  type: 'mcq' | 'truefalse' | 'shortanswer' | 'essay';
  question: string;
  options?: string[];
  answer?: string;
  section?: string;
}

const UpcomingExamsTab = ({ 
  exams, 
  onSendReminder, 
  phoneNumber, 
  setPhoneNumber, 
  isWhatsAppSetup = false,
  onDeleteExam 
}: UpcomingExamsTabProps) => {
  const [selectedExamIndex, setSelectedExamIndex] = useState<string>("0");
  const { toast } = useToast();
  
  const [examContentDialogOpen, setExamContentDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<IExam | null>(null);
  
  // Handle exam selection in upcoming exams tab
  const handleExamSelect = (value: string) => {
    setSelectedExamIndex(value);
  };
  
  // Handle delete exam button click
  const handleDeleteClick = (exam: IExam) => {
    setExamToDelete(exam);
    setDeleteConfirmOpen(true);
  };
  
  // Handle confirmed deletion
  const handleConfirmDelete = () => {
    if (examToDelete && examToDelete.id && onDeleteExam) {
      onDeleteExam(examToDelete.id);
      toast({
        title: "Exam Deleted",
        description: `${examToDelete.name} has been deleted successfully.`
      });
      
      // If the deleted exam was selected, reset selection to the first exam
      if (parseInt(selectedExamIndex) === exams.findIndex(e => e.id === examToDelete.id)) {
        setSelectedExamIndex("0");
      }
    }
    setDeleteConfirmOpen(false);
    setExamToDelete(null);
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
  
  // Simple function to convert markdown to HTML
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    
    // Basic markdown parsing - replace markdown syntax with HTML
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Emphasis (bold and italic)
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/_(.*?)_/gim, '<em>$1</em>')
      
      // Lists - Unordered
      .replace(/^\s*[-*+]\s+(.*$)/gim, '<ul><li>$1</li></ul>')
      // Lists - Ordered
      .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<ol><li>$2</li></ol>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      
      // Code blocks
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      
      // Paragraphs
      .replace(/^\s*(\n)?(.+)/gim, function(m) {
        return /^\s*(<(\/)?(h|ul|ol|li|blockquote|pre|p))/i.test(m) ? m : '<p>' + m + '</p>';
      })
      
      // Line breaks
      .replace(/\n/gim, '<br />');
    
    // Fix duplicate tags caused by multi-line regex
    html = html.replace(/<\/ul>\s*<ul>/gim, '')
               .replace(/<\/ol>\s*<ol>/gim, '')
               .replace(/<\/p>\s*<p>/gim, '<br />');
    
    return html;
  };
  
  // Generate HTML content for the exam window
  const generateExamHtml = (exam: IExam, questions: any[]) => {
    const questionHtml = questions.map((q, index) => `
      <div class="question-container" id="question-${index}">
        <div class="question-header">
          <h3>Question ${index + 1}</h3>
          ${q.section ? `<div class="question-section">${q.section}</div>` : ''}
        </div>
        <div class="question-content">
          ${markdownToHtml(q.question)}
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
            --accent: #f8fafc;
            --accent-foreground: #0f172a;
            --destructive: #ef4444;
            --destructive-foreground: white;
            --warning: #f59e0b;
            --warning-foreground: #78350f;
            --success: #10b981;
            --success-foreground: white;
          }
          
          /* Dark mode support */
          @media (prefers-color-scheme: dark) {
            :root {
              --primary: #3b82f6;
              --primary-foreground: white;
              --background: #0f172a;
              --accent: #1e293b;
              --accent-foreground: #f8fafc;
              --muted: #1e293b;
              --muted-foreground: #94a3b8;
              --border: #1e293b;
              --border-hover: #334155;
            }
            
            body {
              background-color: var(--background);
              color: var(--accent-foreground);
            }
            
            .question-container {
              background-color: var(--accent);
            }
            
            .question-number {
              background-color: var(--muted);
              color: var(--muted-foreground);
            }
            
            .question-number.current {
              background-color: var(--primary);
              color: var(--primary-foreground);
            }
            
            .question-number.answered {
              background-color: var(--success);
              color: var(--success-foreground);
            }
            
            .question-number.for-review {
              background-color: var(--warning);
              color: var(--warning-foreground);
            }
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1e293b;
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
          }
          
          .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
          }
          
          .sidebar-header h2 {
            margin: 0;
            font-size: 18px;
            color: var(--accent-foreground);
          }
          
          .sidebar-header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            color: var(--muted-foreground);
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
          
          /* Main content styles */
          .main-content {
            flex-grow: 1;
            padding: 20px;
            overflow-y: auto;
          }
          
          .question-container {
            border: 1px solid var(--border);
            border-radius: 8px;
            margin-bottom: 20px;
            padding: 20px;
            background-color: white;
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
          }
          
          .question-content h1, 
          .question-content h2, 
          .question-content h3 {
            margin-top: 0;
          }
          
          .question-content p {
            margin-bottom: 15px;
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
          
          /* Options for MCQs */
          .options {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .option {
            display: flex;
            align-items: flex-start;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.1s ease;
          }
          
          .option:hover {
            border-color: var(--border-hover);
            background-color: var(--accent);
          }
          
          .option-radio {
            margin-right: 12px;
            width: 20px;
            height: 20px;
            border: 2px solid var(--border);
            border-radius: 50%;
            flex-shrink: 0;
            position: relative;
            margin-top: 2px;
          }
          
          .option-radio.selected {
            border-color: var(--primary);
          }
          
          .option-radio.selected:after {
            content: '';
            position: absolute;
            top: 4px;
            left: 4px;
            width: 8px;
            height: 8px;
            background-color: var(--primary);
            border-radius: 50%;
          }
          
          .option-text {
            flex-grow: 1;
          }
          
          /* Text inputs and textareas */
          .text-input, .essay-input {
            width: 100%;
            padding: 12px;
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.2s ease;
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
            transition: all 0.1s ease;
          }
          
          .button:hover {
            opacity: 0.9;
          }
          
          .button.secondary {
            background-color: var(--accent);
            color: var(--accent-foreground);
            border: 1px solid var(--border);
          }
          
          .button.review {
            background-color: var(--warning);
            color: var(--warning-foreground);
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
            ${questionHtml}
            
            <div class="navigation">
              <button class="button secondary" id="prev-button" onclick="prevQuestion()">Previous</button>
              <button class="button review" id="review-button" onclick="markForReview()">Mark for Review</button>
              <button class="button secondary" id="next-button" onclick="nextQuestion()">Next</button>
            </div>
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
          const questionsForReview = new Set();
          let startTime = Date.now();
          let timerInterval;
          
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
            
            // Start the timer
            startTimer();
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
          
          // Setup tracking for answers with improved radio button styling
          function setupAnswerTracking() {
            // Handle custom radio buttons for MCQs
            document.querySelectorAll('.option').forEach(option => {
              option.addEventListener('click', function() {
                const questionId = this.getAttribute('data-question');
                const value = this.getAttribute('data-value');
                const radioButton = this.querySelector('.option-radio');
                
                // Remove selected class from all options in this question
                document.querySelectorAll(\`.option[data-question="\${questionId}"]\`).forEach(opt => {
                  opt.querySelector('.option-radio').classList.remove('selected');
                });
                
                // Mark this option as selected
                radioButton.classList.add('selected');
                
                // Save the answer
                answers[questionId] = value;
                updateProgress();
                markQuestionAnswered(questionId.split('q')[1]);
              });
            });
            
            // Text inputs (Short answer)
            document.querySelectorAll('input[type="text"]').forEach(input => {
              input.addEventListener('input', function() {
                const questionId = this.getAttribute('data-question');
                const value = this.value.trim();
                
                if (value) {
                  answers[questionId] = value;
                  markQuestionAnswered(questionId.split('q')[1]);
                } else {
                  delete answers[questionId];
                  unmarkQuestionAnswered(questionId.split('q')[1]);
                }
                
                updateProgress();
              });
            });
            
            // Textareas (Essays)
            document.querySelectorAll('textarea').forEach(textarea => {
              textarea.addEventListener('input', function() {
                const questionId = this.getAttribute('data-question');
                const value = this.value.trim();
                
                if (value) {
                  answers[questionId] = value;
                  markQuestionAnswered(questionId.split('q')[1]);
                } else {
                  delete answers[questionId];
                  unmarkQuestionAnswered(questionId.split('q')[1]);
                }
                
                // Update word count
                const wordCount = value.split(/\\s+/).filter(Boolean).length;
                const wordCountEl = document.getElementById(questionId + '-wordcount');
                if (wordCountEl) {
                  wordCountEl.textContent = wordCount + ' words';
                }
                
                updateProgress();
              });
            });
          }
          
          // Mark a question button as answered
          function markQuestionAnswered(index) {
            const questionBtn = document.getElementById('question-button-' + index);
            if (!questionsForReview.has(Number(index))) {
              questionBtn.classList.add('answered');
            }
          }
          
          // Unmark a question as answered
          function unmarkQuestionAnswered(index) {
            const questionBtn = document.getElementById('question-button-' + index);
            if (!questionsForReview.has(Number(index))) {
              questionBtn.classList.remove('answered');
            }
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
            const unansweredCount = totalQuestions - answeredCount;
            
            if (unansweredCount > 0 || questionsForReview.size > 0) {
              let message = '';
              
              if (unansweredCount > 0) {
                message += 'You have ' + unansweredCount + ' unanswered questions. ';
              }
              
              if (questionsForReview.size > 0) {
                message += 'You have ' + questionsForReview.size + ' questions marked for review. ';
              }
              
              message += 'Are you sure you want to submit?';
              
              const confirm = window.confirm(message);
              if (!confirm) return;
            }
            
            // Stop the timer
            clearInterval(timerInterval);
            
            // Disable all inputs
            document.querySelectorAll('input, textarea, .option').forEach(input => {
              if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                input.disabled = true;
              } else {
                input.style.pointerEvents = 'none';
                input.style.opacity = '0.7';
              }
            });
            
            // Show completion message
            const examContainer = document.querySelector('.main-content');
            const completionMessage = document.createElement('div');
            completionMessage.className = 'question-container';
            completionMessage.innerHTML = \`
              <h3 style="text-align: center; color: #16a34a;">Exam Submitted!</h3>
              <p style="text-align: center;">Thank you for completing this exam.</p>
              <p style="text-align: center;">You answered \${Object.keys(answers).length} out of \${totalQuestions} questions.</p>
              <div style="text-align: center; margin-top: 20px;">
                <button class="button" onclick="window.close()">Close Window</button>
              </div>
            \`;
            
            examContainer.innerHTML = '';
            examContainer.appendChild(completionMessage);
            
            // Hide the navigation buttons and question grid
            document.querySelector('.navigation').style.display = 'none';
            document.querySelector('.sidebar-actions').style.display = 'none';
            
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
              <div class="option" data-question="q${index}" data-value="${option}">
                <div class="option-radio"></div>
                <div class="option-text">${markdownToHtml(option)}</div>
              </div>
            `).join('') || ''}
          </div>
        `;
        
      case 'truefalse':
        return `
          <div class="options">
            <div class="option" data-question="q${index}" data-value="true">
              <div class="option-radio"></div>
              <div class="option-text">True</div>
            </div>
            <div class="option" data-question="q${index}" data-value="false">
              <div class="option-radio"></div>
              <div class="option-text">False</div>
            </div>
          </div>
        `;
        
      case 'shortanswer':
        return `
          <input type="text" class="text-input" data-question="q${index}" placeholder="Your answer...">
        `;
        
      case 'essay':
        return `
          <textarea class="essay-input" data-question="q${index}" placeholder="Write your answer here..."></textarea>
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
                <p className="font-medium">{exams[parseInt(selectedExamIndex) || 0]?.name}</p>
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
                <span className="text-sm text-muted-foreground">Number of Questions:</span>
                <p>{exams[parseInt(selectedExamIndex) || 0]?.numberOfQuestions}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Difficulty:</span>
                <p>{exams[parseInt(selectedExamIndex) || 0]?.difficulty}</p>
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
                  {exams[parseInt(selectedExamIndex) || 0]?.topics?.map((topic, i) => (
                    <span key={i} className="bg-muted px-2 py-1 rounded text-xs">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-3 flex flex-wrap gap-2">
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
                  onClick={() => onSendReminder(exams[parseInt(selectedExamIndex) || 0])}
                >
                  <Bell className="h-4 w-4 mr-1" /> Send Reminder
                </Button>
                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteClick(exams[parseInt(selectedExamIndex) || 0])}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete Exam
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogTitle>Delete Exam</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{examToDelete?.name}"? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UpcomingExamsTab;
