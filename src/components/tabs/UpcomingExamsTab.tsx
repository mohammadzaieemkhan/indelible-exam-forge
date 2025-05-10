import { useState } from "react";
import { Bell, FileText, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { IExam } from "@/components/ExamTabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

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
  const [examContentDialogOpen, setExamContentDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string | string[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const { toast } = useToast();
  
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
  
  // Handle view exam content
  const handleViewExam = (exam: IExam) => {
    setSelectedExam(exam);
    setExamSubmitted(false);
    
    if (exam.questions) {
      // Parse the questions for proper rendering
      const parsed = parseQuestions(exam.questions);
      setParsedQuestions(parsed);
    } else {
      setParsedQuestions([]);
    }
    
    // Reset user answers and start at first question
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setExamContentDialogOpen(true);
  };
  
  // Handle user answering a question
  const handleAnswerChange = (questionIndex: number, value: string | string[]) => {
    setUserAnswers({
      ...userAnswers,
      [questionIndex]: value
    });
  };
  
  // Navigate to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < parsedQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };
  
  // Navigate to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  // Jump to specific question
  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < parsedQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };
  
  // Handle submitting the exam
  const handleSubmitExam = () => {
    // Check if all questions are answered
    const totalQuestions = parsedQuestions.length;
    const answeredQuestions = Object.keys(userAnswers).length;
    
    // Allow submission with confirmation if not all questions are answered
    if (answeredQuestions < totalQuestions) {
      const isConfirmed = window.confirm(`You've only answered ${answeredQuestions} out of ${totalQuestions} questions. Are you sure you want to submit?`);
      if (!isConfirmed) return;
    }
    
    // Save answers and calculate score
    setExamSubmitted(true);
    
    // Display submission message
    toast({
      title: "Exam Submitted",
      description: `Your answers have been submitted successfully.`,
    });
    
    // In a real application, you'd send these answers to a backend
    console.log("User answers:", userAnswers);
  };
  
  // Count answered questions for progress tracking
  const answeredQuestionsCount = Object.keys(userAnswers).length;
  const completionPercentage = parsedQuestions.length > 0 
    ? (answeredQuestionsCount / parsedQuestions.length) * 100 
    : 0;
  
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
            className="mt-4 space-y-3"
            disabled={examSubmitted}
          >
            {question.options?.map((option, optIdx) => (
              <div key={optIdx} className="flex items-center space-x-2 p-2 rounded-md border hover:bg-slate-50">
                <RadioGroupItem value={option} id={`q${index}-opt${optIdx}`} />
                <Label htmlFor={`q${index}-opt${optIdx}`} className="flex-grow cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );
        
      case 'truefalse':
        return (
          <RadioGroup
            value={userAnswers[index] as string || ""}
            onValueChange={(value) => handleAnswerChange(index, value)}
            className="mt-4 space-y-3"
            disabled={examSubmitted}
          >
            <div className="flex items-center space-x-2 p-2 rounded-md border hover:bg-slate-50">
              <RadioGroupItem value="true" id={`q${index}-true`} />
              <Label htmlFor={`q${index}-true`} className="flex-grow cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md border hover:bg-slate-50">
              <RadioGroupItem value="false" id={`q${index}-false`} />
              <Label htmlFor={`q${index}-false`} className="flex-grow cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );
        
      case 'shortanswer':
        return (
          <div className="mt-4">
            <Input
              value={userAnswers[index] as string || ""}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Your answer..."
              className="w-full p-2"
              disabled={examSubmitted}
            />
            {question.answer && examSubmitted && (
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-semibold">Example answer:</span> {question.answer}
              </p>
            )}
          </div>
        );
        
      case 'essay':
        return (
          <div className="mt-4">
            <Textarea
              value={userAnswers[index] as string || ""}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              placeholder="Write your answer here..."
              className="w-full p-2 min-h-[150px]"
              disabled={examSubmitted}
            />
            {/* Word count display */}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>
                Word count: {((userAnswers[index] as string) || "").split(/\s+/).filter(Boolean).length}
              </span>
              {question.answer && examSubmitted && (
                <span className="font-semibold">Suggested answer points available</span>
              )}
            </div>
          </div>
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
      
      {/* Exam Content Dialog - Improved Google Forms Style */}
      <Dialog open={examContentDialogOpen} onOpenChange={setExamContentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" /> {selectedExam?.name}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>{selectedExam?.date} at {selectedExam?.time} • {selectedExam?.duration} minutes</span>
              {!examSubmitted && (
                <span className="text-sm font-medium">
                  Question {currentQuestionIndex + 1} of {parsedQuestions.length}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExam?.isActive ? (
            <>
              {parsedQuestions.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  {/* Progress bar */}
                  <div className="py-2 px-1">
                    <Progress value={completionPercentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{answeredQuestionsCount} of {parsedQuestions.length} answered</span>
                      <span>{completionPercentage.toFixed(0)}% complete</span>
                    </div>
                  </div>
                  
                  {/* Question area */}
                  <div className="p-4">
                    {examSubmitted ? (
                      // Show all questions and answers when submitted
                      <div className="space-y-8">
                        <div className="text-center py-4 mb-4 bg-green-50 rounded-md">
                          <h2 className="text-xl font-bold text-green-700">Exam Submitted</h2>
                          <p className="text-green-600">Thank you for completing this exam.</p>
                        </div>
                        
                        {parsedQuestions.map((question, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardHeader className="bg-slate-50 py-3">
                              <h3 className="font-medium">Question {index + 1}{question.section ? ` (${question.section})` : ''}</h3>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p className="mb-2">{question.question}</p>
                              {renderQuestionInput(question, index)}
                              
                              {/* Show user's answer summary */}
                              <div className="mt-4 pt-2 border-t">
                                <p className="text-sm font-medium">Your answer:</p>
                                <p className="text-muted-foreground">
                                  {userAnswers[index] ? 
                                    (typeof userAnswers[index] === 'string' ? 
                                      userAnswers[index] : 
                                      (userAnswers[index] as string[]).join(', ')) : 
                                    'Not answered'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      // Show single question at a time when taking the exam
                      <>
                        <div className="mb-6">
                          {parsedQuestions[currentQuestionIndex].section && (
                            <div className="text-sm font-medium text-primary mb-2">
                              {parsedQuestions[currentQuestionIndex].section}
                            </div>
                          )}
                          <h2 className="text-lg font-medium mb-2">
                            Question {currentQuestionIndex + 1}: {parsedQuestions[currentQuestionIndex].question}
                          </h2>
                          {renderQuestionInput(parsedQuestions[currentQuestionIndex], currentQuestionIndex)}
                        </div>
                        
                        {/* Question navigation buttons */}
                        <div className="flex justify-between mt-6">
                          <Button 
                            variant="outline" 
                            onClick={handlePreviousQuestion}
                            disabled={currentQuestionIndex === 0}
                          >
                            Previous
                          </Button>
                          
                          <div className="flex space-x-2 overflow-x-auto p-1 max-w-[300px]">
                            {parsedQuestions.map((_, index) => (
                              <button
                                key={index}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                  ${currentQuestionIndex === index ? 'bg-primary text-primary-foreground' : 
                                    userAnswers[index] !== undefined ? 'bg-green-100 text-green-800 border border-green-300' : 
                                    'border bg-background hover:bg-muted'}`}
                                onClick={() => handleJumpToQuestion(index)}
                              >
                                {index + 1}
                              </button>
                            ))}
                          </div>
                          
                          {currentQuestionIndex < parsedQuestions.length - 1 ? (
                            <Button 
                              onClick={handleNextQuestion}
                            >
                              Next
                            </Button>
                          ) : (
                            <Button 
                              onClick={handleSubmitExam}
                              variant="default"
                            >
                              Submit Exam
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No questions found in the exam content. Please regenerate the exam.
                  </p>
                </div>
              )}
              
              {examSubmitted && (
                <DialogFooter className="border-t pt-4">
                  <Button onClick={() => setExamContentDialogOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
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
