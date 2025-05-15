
import { useState } from "react";
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
  const { toast } = useToast();
  
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
    // Directly call the handleViewExam method from ExamRenderer
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
            {exams.map((exam, index) => (
              <ExamCard 
                key={exam.id || index}
                exam={exam} 
                onSendReminder={onSendReminder}
                onDeleteClick={handleDeleteClick}
                onViewExam={handleViewExam}
              />
            ))}
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
