
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IExam } from "@/components/ExamTabs";
import { useToast } from "@/hooks/use-toast";
import { Info, Filter } from "lucide-react";
import ExamCard from "@/components/exam/ExamCard";
import DeleteExamDialog from "@/components/exam/DeleteExamDialog";
import ExamRenderer from "@/components/exam/ExamRenderer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

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
  const [examToDelete, setExamToDelete] = useState<IExam | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [activeExams, setActiveExams] = useState<IExam[]>([]);
  const { toast } = useToast();
  
  // Check which exams should be active based on current time
  useEffect(() => {
    const now = new Date();
    
    const updatedExams = exams.map(exam => {
      // Create a date object from exam date and time
      const examDateTime = new Date(`${exam.date}T${exam.time}`);
      
      // Mark exam as active if current time is past scheduled time
      const isActive = examDateTime <= now;
      
      return {
        ...exam,
        isActive: isActive
      };
    });
    
    setActiveExams(updatedExams);
  }, [exams]);
  
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
    }
    setDeleteConfirmOpen(false);
    setExamToDelete(null);
  };
  
  // Open exam in a new window
  const handleViewExam = (exam: IExam) => {
    // Check if the exam should be available based on current time
    const now = new Date();
    const examDateTime = new Date(`${exam.date}T${exam.time}`);
    const isAvailable = examDateTime <= now;
    
    if (!isAvailable) {
      const timeRemaining = getTimeRemaining(examDateTime);
      toast({
        title: "Exam Not Available Yet",
        description: `This exam will be available in ${timeRemaining}`,
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
    
    // Import the necessary functions from ExamRenderer
    import('@/components/exam/ExamRenderer').then(module => {
      const { parseQuestions, generateExamHtml } = module;
      
      // Parse questions and generate HTML for the exam
      const parsedQuestions = parseQuestions(exam.questions || "");
      const examContent = generateExamHtml(exam, parsedQuestions);
      
      // Write content to the new window
      examWindow.document.open();
      examWindow.document.write(examContent);
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
    });
  };
  
  // Helper function to format time remaining
  const getTimeRemaining = (examTime: Date): string => {
    const now = new Date();
    const diffMs = examTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return "now";
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} and ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} and ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Upcoming Exams</CardTitle>
          <CardDescription>View and manage your scheduled exams</CardDescription>
        </div>
        {!isWhatsAppSetup && (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="WhatsApp number with country code"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full max-w-xs"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {exams.length === 0 ? (
          <Alert variant="default" className="bg-muted/50">
            <Info className="h-4 w-4" />
            <AlertTitle>No upcoming exams</AlertTitle>
            <AlertDescription>
              You don't have any upcoming exams scheduled. Go to the Generate Exam tab to create a new exam.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {exams.map((exam, index) => {
              // Calculate if exam should be active
              const now = new Date();
              const examDateTime = new Date(`${exam.date}T${exam.time}`);
              const isActive = examDateTime <= now;
              
              return (
                <ExamCard 
                  key={exam.id || index}
                  exam={{...exam, isActive: isActive}} 
                  onSendReminder={onSendReminder}
                  onDeleteClick={handleDeleteClick}
                  onViewExam={handleViewExam}
                />
              );
            })}
          </div>
        )}
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <DeleteExamDialog 
        open={deleteConfirmOpen}
        examToDelete={examToDelete}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={handleConfirmDelete}
      />
    </Card>
  );
};

export default UpcomingExamsTab;
