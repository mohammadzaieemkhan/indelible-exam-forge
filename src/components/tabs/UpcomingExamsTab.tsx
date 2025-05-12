
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IExam } from "@/components/ExamTabs";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
import ExamCard from "@/components/exam/ExamCard";
import DeleteExamDialog from "@/components/exam/DeleteExamDialog";
import ExamRenderer from "@/components/exam/ExamRenderer";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onSendReminder: (exam: IExam) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
  isWhatsAppSetup?: boolean;
  onDeleteExam?: (examId: string) => void;
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
  const [examToDelete, setExamToDelete] = useState<IExam | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
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
  
  // Open exam in a new window - Fixed to not use 'new' with the component
  const handleViewExam = (exam: IExam) => {
    // Use the imported ExamRenderer's utility functions directly
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
    
    // Import directly from ExamRenderer's utilities
    import('@/components/exam/utils/examParser').then(({ parseQuestions, markdownToHtml }) => {
      // Parse questions
      const parsedQuestions = parseQuestions(exam.questions || "");
      
      // Generate HTML content
      const examContent = generateExamHtml(exam, parsedQuestions, markdownToHtml);
      
      // Write content to window
      examWindow.document.open();
      examWindow.document.write(examContent);
      examWindow.document.close();
      
      // Add event listener for exam completion
      examWindow.addEventListener('examCompleted', (event: any) => {
        // Move exam from upcoming to previous when completed
        if (event.detail && event.detail.examId === exam.id) {
          window.parent.postMessage({
            type: 'examCompleted',
            examData: event.detail
          }, '*');
        }
      });
      
      // Request fullscreen after loading
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
    });
  };
  
  // Helper function to generate exam HTML - extracted from ExamRenderer
  const generateExamHtml = (exam: IExam, questions: any[], markdownToHtml: (text: string) => string) => {
    // This is a simplified version of the HTML generation logic
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${exam.name}</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
          }
          .exam-header {
            margin-bottom: 20px;
            text-align: center;
          }
          .question {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
          }
          .option-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
          }
          .option-item input[type="radio"] {
            margin-right: 8px;
            width: 16px;
            height: 16px;
          }
          .option-label {
            font-size: 16px;
          }
          .submit-section {
            margin-top: 30px;
            text-align: center;
          }
          .btn {
            background-color: #3b82f6;
            color: white;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
          }
          .btn:hover {
            background-color: #2563eb;
          }
          .btn-exit {
            background-color: #6b7280;
            margin-left: 10px;
          }
        </style>
      </head>
      <body>
        <div class="exam-header">
          <h1>${exam.name}</h1>
          <p>${exam.date} • ${exam.duration} minutes</p>
        </div>
        
        <form id="exam-form">
          <div id="questions">
            ${questions.map((q, index) => {
              // Extract options from the question if it's an MCQ
              let options = [];
              if (q.options) {
                options = q.options;
              } else if (q.question.includes("A)") || q.question.includes("A.")) {
                // Attempt to parse options from question text (common format in generated questions)
                const optionsMatch = q.question.match(/([A-D])[.)](.+?)(?=(?:[A-D][.)]|$))/g);
                if (optionsMatch) {
                  options = optionsMatch.map((o: string) => o.trim());
                }
              }
              
              return `
                <div class="question">
                  <h3>Question ${index + 1}</h3>
                  <div>${markdownToHtml(q.question)}</div>
                  
                  <div class="answer-section">
                    ${options.length > 0 ? 
                      options.map((option: string, optIndex: number) => `
                        <div class="option-item">
                          <input 
                            type="radio" 
                            id="q${index}_opt${optIndex}" 
                            name="q${index}" 
                            value="${option}"
                          />
                          <label class="option-label" for="q${index}_opt${optIndex}">${option}</label>
                        </div>
                      `).join('') 
                      : 
                      `<textarea name="q${index}" rows="4" style="width: 100%; padding: 8px;"></textarea>`
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div class="submit-section">
            <button type="submit" class="btn">Submit Exam</button>
            <button type="button" class="btn btn-exit" onclick="window.close()">Exit Exam</button>
          </div>
        </form>
        
        <script>
          // Set up timer
          const startTime = new Date();
          
          // Handle form submission
          document.getElementById('exam-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Calculate time taken
            const endTime = new Date();
            const timeTaken = Math.round((endTime - startTime) / 60000); // minutes
            
            // Collect answers
            const answers = {};
            const formData = new FormData(this);
            for (const [name, value] of formData.entries()) {
              answers[name] = value;
            }
            
            // Store in localStorage for parent window to access
            const examData = {
              examId: "${exam.id}",
              examName: "${exam.name}",
              date: new Date().toISOString(),
              answers: answers,
              timeTaken: timeTaken + " minutes",
              questions: ${JSON.stringify(questions)},
              questionWeights: ${JSON.stringify(exam.questionWeights || {})},
              questionTypes: ["mcq"] // Simplifying for this example
            };
            
            localStorage.setItem('completedExamId', "${exam.id}");
            localStorage.setItem('lastExamResults', JSON.stringify(examData));
            
            // Create and dispatch custom event
            const completedEvent = new CustomEvent('examCompleted', { 
              detail: examData,
              bubbles: true 
            });
            document.dispatchEvent(completedEvent);
            
            // Send message to parent window
            window.opener.postMessage({
              type: 'examCompleted',
              examData: examData
            }, '*');
            
            // Close the window after a short delay
            setTimeout(() => {
              alert('Exam submitted successfully! You may close this window.');
              window.close();
            }, 500);
          });
        </script>
      </body>
      </html>
    `;
  };
  
  return (
    <div className="space-y-4">
      {exams.length === 0 ? (
        <Alert variant="default" className="bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertTitle>No upcoming exams</AlertTitle>
          <AlertDescription>
            You don't have any upcoming exams scheduled. Go to the Generate Exam tab to create a new exam.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex-1 w-full">
              <Select value={selectedExamIndex} onValueChange={handleExamSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {exam.name} ({exam.date})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!isWhatsAppSetup && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center w-full sm:w-auto gap-2">
                <Input
                  type="text"
                  placeholder="WhatsApp number with country code"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
            )}
          </div>
          
          {exams.length > 0 && parseInt(selectedExamIndex) >= 0 && parseInt(selectedExamIndex) < exams.length && (
            <ExamCard 
              exam={exams[parseInt(selectedExamIndex)]} 
              onSendReminder={onSendReminder}
              onDeleteClick={handleDeleteClick}
              onViewExam={handleViewExam}
            />
          )}
        </>
      )}
      
      {/* Delete confirmation dialog */}
      <DeleteExamDialog 
        open={deleteConfirmOpen}
        examToDelete={examToDelete}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
};

export default UpcomingExamsTab;
