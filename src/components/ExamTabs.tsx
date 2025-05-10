
import { useState, useEffect } from "react";
import { Bell, Calendar, BarChart, BookOpen, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppNotification } from "@/utils/apiService";
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
}

const ExamTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [generatedExam, setGeneratedExam] = useState<IExam | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<IExam[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [isWhatsAppSetup, setIsWhatsAppSetup] = useState<boolean>(false);

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
      isActive: false // Initially not active - exams can only be taken after scheduled time
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
          <PreviousExamsTab exams={[]} />
        </TabsContent>
        
        {/* Upcoming Exams Tab */}
        <TabsContent value="upcoming" className="space-y-6 animate-fade-in">
          <UpcomingExamsTab 
            exams={upcomingExams}
            onSendReminder={openNotificationDialog}
            phoneNumber={phoneNumber}
            setPhoneNumber={setPhoneNumber}
            isWhatsAppSetup={isWhatsAppSetup}
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
