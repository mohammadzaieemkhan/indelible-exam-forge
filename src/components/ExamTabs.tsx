
import { useState, useEffect } from "react";
import { Bell, Calendar, BarChart, BookOpen, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}

const ExamTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [generatedExam, setGeneratedExam] = useState<IExam | null>(null);
  const [upcomingExams, setUpcomingExams] = useState<IExam[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [notificationDialogOpen, setNotificationDialogOpen] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);

  const { toast } = useToast();
  
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
        
        // Show notification for newly activated exams
        const newlyActivated = updatedExams.filter(
          (exam, i) => exam.isActive && !upcomingExams[i].isActive
        );
        
        if (newlyActivated.length > 0) {
          toast({
            title: "Exam Available",
            description: `${newlyActivated[0].name} is now available to take`,
          });
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [upcomingExams, toast]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  // Handle saving an exam
  const handleSaveExam = (exam: IExam) => {
    const newExam = {
      ...exam,
      id: `exam-${Date.now()}`, // Simple ID for tracking
      isActive: false // Initially not active
    };
    
    setUpcomingExams([...upcomingExams, newExam]);
    setGeneratedExam(null);
    
    toast({
      title: "Exam Saved",
      description: "The exam has been moved to upcoming exams"
    });
  };
  
  // Handle WhatsApp notification sending
  const handleSendReminder = async () => {
    if (!selectedExam) return;
    
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    
    setIsNotifying(true);
    
    try {
      // Format phone number if needed (add country code if missing)
      let formattedNumber = phoneNumber;
      if (!formattedNumber.startsWith('+')) {
        formattedNumber = `+1${formattedNumber}`; // Default to US if no country code
      }
      
      await sendWhatsAppNotification(
        formattedNumber,
        `Reminder: Your exam "${selectedExam.name}" is scheduled for ${selectedExam.date} at ${selectedExam.time}. The exam will be ${selectedExam.duration} minutes long. Good luck!`
      );
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
      <Tabs defaultValue="generate" className="space-y-6" onValueChange={handleTabChange}>
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
                Include the country code (e.g., +1 for US)
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
