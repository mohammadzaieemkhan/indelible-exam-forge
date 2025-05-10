
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { IExam } from "@/components/ExamTabs";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onSendReminder: (exam: IExam) => void;
  phoneNumber: string;
  setPhoneNumber: (number: string) => void;
}

interface ParsedQuestionItem {
  type: 'mcq' | 'truefalse' | 'shortanswer' | 'essay';
  question: string;
  options?: string[];
  answer?: string;
}

const UpcomingExamsTab = ({ exams, onSendReminder, phoneNumber, setPhoneNumber }: UpcomingExamsTabProps) => {
  const [selectedExamIndex, setSelectedExamIndex] = useState<string>("0");
  const [examContentDialogOpen, setExamContentDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  
  // Handle exam selection in upcoming exams tab
  const handleExamSelect = (value: string) => {
    setSelectedExamIndex(value);
  };
  
  // Parse questions from raw content
  const parseQuestions = (content: string): ParsedQuestionItem[] => {
    const questions: ParsedQuestionItem[] = [];
    const lines = content.split('\n');
    
    let currentQuestion: Partial<ParsedQuestionItem> | null = null;
    let currentOptions: string[] = [];
    
    for (const line of lines) {
      // Detect questions by common patterns
      if (/^\d+[\.\)]/.test(line.trim()) || /^Question \d+:/.test(line.trim())) {
        // Save the previous question if exists
        if (currentQuestion?.question) {
          questions.push({
            ...currentQuestion as ParsedQuestionItem,
            options: currentOptions.length > 0 ? [...currentOptions] : undefined
          });
        }
        
        // Start a new question
        currentQuestion = {
          question: line.trim(),
          type: 'mcq' // Default, we'll update based on content
        };
        currentOptions = [];
      } 
      // Detect options
      else if (/^[A-D][\.\)]/.test(line.trim()) || /^\([A-D]\)/.test(line.trim())) {
        currentOptions.push(line.trim());
        if (currentQuestion) currentQuestion.type = 'mcq';
      }
      // Detect true/false
      else if (/true|false/i.test(line.trim()) && currentOptions.length < 2 && currentQuestion) {
        currentOptions.push(line.trim());
        if (currentQuestion) currentQuestion.type = 'truefalse';
      }
      // Detect essay questions by keywords
      else if (/essay|explain|describe|discuss|elaborate/i.test(line.trim()) && currentQuestion) {
        currentQuestion.type = 'essay';
      }
      // Add the line to the current question if it's a continuation
      else if (currentQuestion && line.trim().length > 0) {
        currentQuestion.question += ' ' + line.trim();
      }
    }
    
    // Add the last question
    if (currentQuestion?.question) {
      questions.push({
        ...currentQuestion as ParsedQuestionItem,
        options: currentOptions.length > 0 ? [...currentOptions] : undefined
      });
    }
    
    return questions.map(q => {
      // If no options and not already marked as essay, mark as short answer
      if (!q.options || q.options.length === 0) {
        if (q.type !== 'essay') {
          return { ...q, type: 'shortanswer' };
        }
      }
      return q;
    });
  };
  
  // Handle view exam content
  const handleViewExam = (exam: IExam) => {
    setSelectedExam(exam);
    
    if (exam.questions) {
      // Parse the questions for proper rendering
      const parsed = parseQuestions(exam.questions);
      setParsedQuestions(parsed);
    } else {
      setParsedQuestions([]);
    }
    
    // Reset user answers
    setUserAnswers({});
    setExamContentDialogOpen(true);
  };
  
  // Handle user answering a question
  const handleAnswerChange = (questionIndex: number, value: string | string[]) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: value
    });
  };
  
  // Handle submitting the exam
  const handleSubmitExam = () => {
    // Here you would save the answers and calculate score
    // For now, just close the dialog
    setExamContentDialogOpen(false);
    
    // In a real application, you'd send these answers to a backend
    console.log("User answers:", userAnswers);
  };
  
  // Get current date for calendar view
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Month names
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  // Render the appropriate input for different question types
  const renderQuestionInput = (question: ParsedQuestionItem, index: number) => {
    switch (question.type) {
      case 'mcq':
        return (
          <RadioGroup
            value={userAnswers[index] as string || ""}
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="mt-2 space-y-2"
          >
            {question.options?.map((option, optIdx) => (
              <div key={optIdx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`q${index}-opt${optIdx}`} />
                <Label htmlFor={`q${index}-opt${optIdx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'truefalse':
        return (
          <RadioGroup
            value={userAnswers[index] as string || ""}
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="mt-2 space-x-4 flex"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id={`q${index}-true`} />
              <Label htmlFor={`q${index}-true`}>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`q${index}-false`} />
              <Label htmlFor={`q${index}-false`}>False</Label>
            </div>
          </RadioGroup>
        );
        
      case 'shortanswer':
        return (
          <Input
            value={userAnswers[index] as string || ""}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Your answer..."
            className="mt-2"
          />
        );
        
      case 'essay':
        return (
          <Textarea
            value={userAnswers[index] as string || ""}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder="Write your answer here..."
            className="mt-2 min-h-[150px]"
          />
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Exams</CardTitle>
        <CardDescription>View and manage scheduled exams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="whatsapp-number">Your WhatsApp Number (for notifications)</Label>
          <Input
            id="whatsapp-number"
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Include the country code (e.g., +1 for US)
          </p>
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
                        onClick={() => handleViewExam(exam)}
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
                        <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 flex space-x-2">
                    <Button 
                      size="sm"
                      disabled={!exams[parseInt(selectedExamIndex) || 0]?.isActive}
                      onClick={() => {
                        if (exams[parseInt(selectedExamIndex) || 0]) {
                          handleViewExam(exams[parseInt(selectedExamIndex) || 0]);
                        }
                      }}
                    >
                      {exams[parseInt(selectedExamIndex) || 0]?.isActive ? 
                        "Take Exam" : "Available Soon"}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (exams[parseInt(selectedExamIndex) || 0]) {
                          onSendReminder(exams[parseInt(selectedExamIndex) || 0]);
                        }
                      }}
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
      
      {/* Exam Content Dialog */}
      <Dialog open={examContentDialogOpen} onOpenChange={setExamContentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.name}</DialogTitle>
            <DialogDescription>
              {selectedExam?.date} at {selectedExam?.time} • {selectedExam?.duration} minutes
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam?.isActive ? (
            <>
              {parsedQuestions.length > 0 ? (
                <div className="space-y-8 py-4">
                  {parsedQuestions.map((question, index) => (
                    <div key={index} className="space-y-2">
                      <h3 className="font-medium text-lg">Question {index + 1}</h3>
                      <p>{question.question}</p>
                      {renderQuestionInput(question, index)}
                    </div>
                  ))}
                  
                  <DialogFooter>
                    <Button onClick={handleSubmitExam}>
                      Submit Exam
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No questions found in the exam content. Please regenerate the exam.
                </p>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-amber-600 font-medium mb-4">
                This exam is not yet available to take
              </p>
              <p className="text-muted-foreground">
                The exam will become available at the scheduled date and time.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UpcomingExamsTab;
