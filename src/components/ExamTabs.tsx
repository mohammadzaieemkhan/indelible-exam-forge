
import { useState, useEffect } from "react";
import { Bell, Calendar, BarChart, BookOpen, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppNotification, useGeminiAI } from "@/utils/apiService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import GenerateExamTab from "./tabs/GenerateExamTab";
import PerformanceTab from "./tabs/PerformanceTab";
import PreviousExamsTab from "./tabs/PreviousExamsTab";
import UpcomingExamsTab from "./tabs/UpcomingExamsTab";

export interface IExam {
  id?: string;
  name: string;
  date: string;
  time: string;
  duration: string;
  numberOfQuestions: string;
  topics: string[];
  difficulty: string;
  questionTypes: string;
  isActive?: boolean;
  questions?: string;
  sections?: any[];
  questionWeights?: Record<number, number>;
}

interface ExamResult {
  examId: string;
  examName: string;
  date: string;
  answers: Record<string, string>;
  timeTaken: string;
  questionTypes: Array<string>;
  questionWeights: Array<number>;
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    answer?: string;
  }>;
}

const ExamTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [generatedExam, setGeneratedExam] = useState<IExam | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<IExam[]>([]);
  const [previousExams, setPreviousExams] = useState<IExam[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [isWhatsAppSetup, setIsWhatsAppSetup] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  const { toast } = useToast();
  
  // Load exams and phone number from localStorage on component mount
  useEffect(() => {
    const savedExams = localStorage.getItem('upcomingExams');
    if (savedExams) {
      try {
        setUpcomingExams(JSON.parse(savedExams));
      } catch (error) {
        console.error('Error parsing saved exams:', error);
      }
    }
    
    const savedPrevExams = localStorage.getItem('previousExams');
    if (savedPrevExams) {
      try {
        setPreviousExams(JSON.parse(savedPrevExams));
      } catch (error) {
        console.error('Error parsing saved previous exams:', error);
      }
    }
    
    // Load phone number if saved
    const savedPhoneNumber = localStorage.getItem('whatsappNumber');
    if (savedPhoneNumber) {
      setPhoneNumber(savedPhoneNumber);
      setIsWhatsAppSetup(true);
    }
  }, []);
  
  // Save exams to localStorage when they change
  useEffect(() => {
    if (upcomingExams.length > 0) {
      localStorage.setItem('upcomingExams', JSON.stringify(upcomingExams));
    }
  }, [upcomingExams]);

  // Save previous exams to localStorage when they change
  useEffect(() => {
    if (previousExams.length > 0) {
      localStorage.setItem('previousExams', JSON.stringify(previousExams));
    }
  }, [previousExams]);

  // Save phone number to localStorage when it changes
  useEffect(() => {
    if (phoneNumber && phoneNumber.length > 5) {
      localStorage.setItem('whatsappNumber', phoneNumber);
      setIsWhatsAppSetup(true);
    }
  }, [phoneNumber]);
  
  // Check for exams that need to be activated
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Check each exam if it's time to activate it
      const updatedExams = upcomingExams.map(exam => {
        if (!exam.isActive) {
          const examDateTime = new Date(`${exam.date}T${exam.time}`);
          
          if (examDateTime <= now) {
            // It's time to activate this exam!
            // Send a WhatsApp notification if phone number is available
            if (phoneNumber && phoneNumber.length > 5) {
              console.log("Sending WhatsApp notification for exam activation:", exam.name);
              sendWhatsAppNotification(
                phoneNumber,
                `Your exam "${exam.name}" is now available to take!`
              ).then(result => {
                console.log("WhatsApp notification result:", result);
                if (!result.success) {
                  toast({
                    title: "Notification Error",
                    description: "Could not send WhatsApp notification. Please check your phone number.",
                    variant: "destructive",
                  });
                }
              }).catch(err => console.error("Failed to send WhatsApp notification:", err));
            }
            
            toast({
              title: "Exam Available",
              description: `${exam.name} is now available to take`,
            });
            
            return { ...exam, isActive: true };
          }
        }
        return exam;
      });
      
      // Update the exams list if there are changes
      const hasChanges = updatedExams.some(
        (exam, i) => exam.isActive !== upcomingExams[i].isActive
      );
      
      if (hasChanges) {
        setUpcomingExams(updatedExams);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [upcomingExams, toast, phoneNumber]);
  
  // Listen for exam completion events from the exam window
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'examCompleted' && event.data.examData) {
        const examData = event.data.examData as ExamResult;
        await processCompletedExam(examData);
      }
    };
    
    // Check the localStorage for a completed exam ID on component mount
    const checkCompletedExam = async () => {
      const completedExamId = localStorage.getItem('completedExamId');
      if (completedExamId) {
        const lastExamResults = localStorage.getItem('lastExamResults');
        if (lastExamResults) {
          try {
            const examData = JSON.parse(lastExamResults) as ExamResult;
            await processCompletedExam(examData);
            localStorage.removeItem('completedExamId');
            localStorage.removeItem('lastExamResults');
          } catch (error) {
            console.error('Error processing completed exam:', error);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    checkCompletedExam();
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [upcomingExams]);
  
  // Process a completed exam
  const processCompletedExam = async (examData: ExamResult) => {
    // Find the exam in upcoming exams
    const examIndex = upcomingExams.findIndex(exam => exam.id === examData.examId);
    if (examIndex === -1) return;
    
    const completedExam = upcomingExams[examIndex];
    if (!completedExam) return;
    
    setIsEvaluating(true);
    toast({
      title: "Evaluating Exam",
      description: "Please wait while the AI evaluates your exam responses..."
    });
    
    try {
      // Evaluate the exam using Gemini AI
      const evaluationPrompt = `Evaluate the following exam responses:
        
      Exam: ${completedExam.name}
      Topic(s): ${completedExam.topics.join(", ")}
      Difficulty: ${completedExam.difficulty}
      
      Questions and Responses:
      ${examData.questions.map((q, idx) => {
        const questionNumber = idx + 1;
        const questionType = q.type;
        const userAnswer = examData.answers[`q${idx}`] || 'Not answered';
        const correctAnswer = q.answer || 'N/A';
        const weight = examData.questionWeights[idx] || 1;
        
        return `
        Question ${questionNumber} (${questionType}, weight: ${weight}): ${q.question}
        ${q.options ? `Options: ${q.options.join(" | ")}` : ''}
        Correct Answer: ${correctAnswer}
        User Answer: ${userAnswer}
        `;
      }).join("\n\n")}
      
      For each question, provide:
      1. Whether the answer is correct (full points), partially correct (partial points), or incorrect (0 points)
      2. A brief explanation/feedback
      3. The points awarded out of the question weight
      
      Also provide:
      - Total score (sum of awarded points)
      - Total possible score (sum of question weights)
      - Percentage score
      - Performance breakdown by topic
      
      Use the following JSON format for your response:
      {
        "questionDetails": [
          {
            "question": "Question text",
            "type": "question type",
            "isCorrect": true/false/partial,
            "feedback": "Brief feedback",
            "marksObtained": number,
            "totalMarks": number,
            "userAnswer": "user's answer",
            "correctAnswer": "correct answer"
          }
        ],
        "totalScore": number,
        "totalPossible": number,
        "percentage": number,
        "topicPerformance": {
          "topic1": percentage,
          "topic2": percentage
        }
      }`;
      
      const evaluationResult = await useGeminiAI({
        task: "evaluate_answer",
        prompt: evaluationPrompt
      });
      
      if (!evaluationResult.success || !evaluationResult.response) {
        throw new Error("Failed to evaluate exam responses");
      }
      
      // Parse the evaluation results
      let parsedEvaluation;
      try {
        // Extract JSON from the response (may be wrapped in markdown code block)
        const jsonMatch = evaluationResult.response.match(/```json\s*([\s\S]*?)\s*```/) || 
                          evaluationResult.response.match(/{[\s\S]*}/);
                          
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : evaluationResult.response;
        parsedEvaluation = JSON.parse(jsonStr);
      } catch (error) {
        console.error("Failed to parse evaluation results:", error);
        console.log("Raw evaluation response:", evaluationResult.response);
        throw new Error("Failed to parse evaluation results");
      }
      
      // Create the exam result object
      const examResult = {
        examId: examData.examId,
        examName: examData.examName,
        date: examData.date,
        score: parsedEvaluation.totalScore,
        totalMarks: parsedEvaluation.totalPossible,
        percentage: parsedEvaluation.percentage,
        timeTaken: examData.timeTaken,
        questionStats: {
          correct: parsedEvaluation.questionDetails.filter((q: any) => q.isCorrect === true).length,
          incorrect: parsedEvaluation.questionDetails.filter((q: any) => q.isCorrect === false).length,
          unattempted: parsedEvaluation.questionDetails.filter((q: any) => !q.userAnswer || q.userAnswer === 'Not answered').length,
          total: parsedEvaluation.questionDetails.length
        },
        topicPerformance: parsedEvaluation.topicPerformance,
        questionDetails: parsedEvaluation.questionDetails
      };
      
      // Save the exam result
      const savedResults = localStorage.getItem('examResults');
      let examResults = savedResults ? JSON.parse(savedResults) : [];
      examResults.push(examResult);
      localStorage.setItem('examResults', JSON.stringify(examResults));
      
      // Move the exam from upcoming to previous
      setPreviousExams(prev => [...prev, completedExam]);
      setUpcomingExams(prev => prev.filter(exam => exam.id !== completedExam.id));
      
      toast({
        title: "Exam Evaluated",
        description: `You scored ${parsedEvaluation.percentage}% on ${completedExam.name}`
      });
      
      // Switch to the performance tab to show results
      setActiveTab("performance");
      
    } catch (error) {
      console.error("Error evaluating exam:", error);
      toast({
        title: "Evaluation Error",
        description: "Failed to evaluate exam responses. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEvaluating(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle saving an exam
  const handleSaveExam = (exam: IExam) => {
    // Set some defaults if missing
    const currentDate = new Date();
    const examDate = exam.date || new Date(currentDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const examTime = exam.time || currentDate.toTimeString().slice(0, 5);
    
    const newExam = {
      ...exam,
      id: `exam-${Date.now()}`, // Simple ID for tracking
      date: examDate,
      time: examTime,
      isActive: false, // Initially not active - exams can only be taken after scheduled time
      questionWeights: exam.questionWeights || {} // Store question weightages
    };
    
    setUpcomingExams([...upcomingExams, newExam]);
    setGeneratedExam(null);
    
    // Automatically switch to upcoming tab
    setActiveTab("upcoming");
    
    toast({
      title: "Exam Saved",
      description: "The exam has been moved to upcoming exams"
    });
  };
  
  // Handle WhatsApp notification sending
  const handleSendReminder = async () => {
    if (!selectedExam) return;
    
    if (!phoneNumber || phoneNumber.length < 5) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number with country code",
        variant: "destructive",
      });
      return;
    }
    
    setIsNotifying(true);
    
    try {
      console.log("Sending WhatsApp reminder for exam:", selectedExam.name);
      
      // Format the message
      const message = `Reminder: Your exam "${selectedExam.name}" is scheduled for ${selectedExam.date} at ${selectedExam.time}. The exam will be ${selectedExam.duration} minutes long. Good luck!`;
      
      // Send the WhatsApp notification
      const result = await sendWhatsAppNotification(phoneNumber, message);
      
      if (result.success) {
        toast({
          title: "Reminder Sent",
          description: "WhatsApp reminder sent successfully!",
        });
        setIsWhatsAppSetup(true);
      } else {
        console.error("Failed to send WhatsApp reminder:", result.error);
        toast({
          title: "Error",
          description: "Failed to send WhatsApp reminder. Check console for details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "Failed to send WhatsApp reminder",
        variant: "destructive",
      });
    } finally {
      setIsNotifying(false);
      setNotificationDialogOpen(false);
    }
  };
  
  // Open notification dialog for a specific exam
  const openNotificationDialog = (exam: IExam) => {
    setSelectedExam(exam);
    setNotificationDialogOpen(true);
  };
  
  // Add delete exam functionality
  const handleDeleteExam = (examId: string) => {
    // Filter out the exam with the specified ID
    const updatedExams = upcomingExams.filter(exam => exam.id !== examId);
    setUpcomingExams(updatedExams);
    
    // Save the updated exams to localStorage
    localStorage.setItem('upcomingExams', JSON.stringify(updatedExams));
  };
  
  return (
    <>
      <Tabs defaultValue="generate" className="space-y-6" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <TabsTrigger value="generate" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BookOpen className="h-4 w-4 mr-2" /> Generate Exam
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <BarChart className="h-4 w-4 mr-2" /> Performance
          </TabsTrigger>
          <TabsTrigger value="previous" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <FileText className="h-4 w-4 mr-2" /> Previous Exams
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Calendar className="h-4 w-4 mr-2" /> Upcoming
          </TabsTrigger>
        </TabsList>
        
        {/* Generate Exam Tab */}
        <TabsContent value="generate" className="space-y-6 animate-fade-in">
          <GenerateExamTab 
            onSaveExam={handleSaveExam} 
            generatedExam={generatedExam} 
            setGeneratedExam={setGeneratedExam} 
          />
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 animate-fade-in">
          <PerformanceTab />
        </TabsContent>
        
        {/* Previous Exams Tab */}
        <TabsContent value="previous" className="space-y-6 animate-fade-in">
          <PreviousExamsTab exams={previousExams} />
        </TabsContent>
        
        {/* Upcoming Exams Tab */}
        <TabsContent value="upcoming" className="space-y-6 animate-fade-in">
          <UpcomingExamsTab 
            exams={upcomingExams}
            onSendReminder={openNotificationDialog}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            isWhatsAppSetup={isWhatsAppSetup}
            onDeleteExam={handleDeleteExam}
          />
        </TabsContent>
      </Tabs>
      
      {/* Notification Dialog */}
      <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send WhatsApp Reminder</DialogTitle>
            <DialogDescription>
              Send a WhatsApp notification to remind about the upcoming exam.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone-number">WhatsApp Number</Label>
              <Input
                id="phone-number"
                placeholder="+1234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Include the country code (e.g., +1 for US). For WhatsApp to work, you may need to send a message to the Twilio number first.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={handleSendReminder}
              disabled={isNotifying}
            >
              {isNotifying ? "Sending..." : "Send Reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExamTabs;
