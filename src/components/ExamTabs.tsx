
import React, { useState, useEffect, Suspense } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UpcomingExamsTab from "@/components/tabs/UpcomingExamsTab";
import PreviousExamsTab from "@/components/tabs/PreviousExamsTab";
import PerformanceTab from "@/components/tabs/PerformanceTab";
import GenerateExamTab from "@/components/tabs/GenerateExamTab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

export interface IExam {
  id?: string;
  name: string;
  description?: string;
  date: string;
  time?: string;
  duration: number;
  isActive: boolean;
  questions?: string | any;
  questionWeights?: { [key: string]: number };
  topics?: string[];
  difficulty?: string;
  numberOfQuestions?: number;
  questionTypes?: string;
  sections?: any[];
}

const ExamTabs = () => {
  const [currentTab, setCurrentTab] = useState("upcoming");
  const [exams, setExams] = useState<IExam[]>([]);
  const [completedExams, setCompletedExams] = useState<any[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Load exams from localStorage on mount
  useEffect(() => {
    const savedExams = localStorage.getItem("exams");
    if (savedExams) {
      try {
        const parsedExams = JSON.parse(savedExams);
        setExams(parsedExams);
      } catch (error) {
        console.error("Error parsing saved exams:", error);
      }
    }

    const savedCompletedExams = localStorage.getItem("completedExams");
    if (savedCompletedExams) {
      try {
        const parsedCompletedExams = JSON.parse(savedCompletedExams);
        setCompletedExams(parsedCompletedExams);
      } catch (error) {
        console.error("Error parsing completed exams:", error);
      }
    }
  }, []);

  // Save exams to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("exams", JSON.stringify(exams));
  }, [exams]);

  // Save completed exams to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("completedExams", JSON.stringify(completedExams));
  }, [completedExams]);

  // Listen for exam completion events
  useEffect(() => {
    const handleExamCompleted = (event: any) => {
      try {
        const examData = event.data?.examData || event.detail;
        if (!examData) return;

        // Add completion timestamp
        const completedExam = {
          ...examData,
          completedAt: new Date().toISOString(),
        };

        // Update completed exams list
        setCompletedExams((prev) => [...prev, completedExam]);

        toast({
          title: "Exam Completed",
          description: "Your exam has been submitted successfully.",
        });
      } catch (error) {
        console.error("Error processing exam completion:", error);
      }
    };

    // Listen for message from exam window
    window.addEventListener("message", handleExamCompleted);
    // Listen for custom event from exam window
    document.addEventListener("examCompleted", handleExamCompleted);

    return () => {
      window.removeEventListener("message", handleExamCompleted);
      document.removeEventListener("examCompleted", handleExamCompleted);
    };
  }, [toast]);

  // Handle adding a new exam
  const handleAddExam = (exam: IExam) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newExam = { ...exam, id };
    setExams((prevExams) => [...prevExams, newExam]);
    setCurrentTab("upcoming");
    toast({
      title: "Exam Created",
      description: `${exam.name} has been created successfully.`,
    });
  };

  // Handle deleting an exam
  const handleDeleteExam = (examId: string) => {
    setExams((prevExams) => prevExams.filter((exam) => exam.id !== examId));
    toast({
      title: "Exam Deleted",
      description: "The exam has been deleted successfully.",
    });
  };

  // Handle editing an exam
  const handleEditExam = (examId: string) => {
    // Find the exam to edit
    const examToEdit = exams.find((exam) => exam.id === examId);
    if (examToEdit) {
      // Logic for editing an exam would go here
      // This is a placeholder that just displays a toast
      toast({
        title: "Edit Exam",
        description: `Editing ${examToEdit.name}`,
      });
    }
  };

  // Handle duplicating an exam
  const handleDuplicateExam = (examId: string) => {
    const examToDuplicate = exams.find((exam) => exam.id === examId);
    if (examToDuplicate) {
      const duplicatedExam = {
        ...examToDuplicate,
        id: Math.random().toString(36).substring(2, 9),
        name: `Copy of ${examToDuplicate.name}`,
      };
      setExams((prevExams) => [...prevExams, duplicatedExam]);
      toast({
        title: "Exam Duplicated",
        description: `${duplicatedExam.name} has been created.`,
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Exam Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
            <div className="overflow-x-auto">
              <TabsList className={`${isMobile ? 'grid grid-cols-2 gap-2 w-full mb-2' : 'flex space-x-2'}`}>
                <TabsTrigger 
                  id="upcoming-tab" 
                  value="upcoming"
                  className={`${isMobile ? 'text-sm py-1 px-2' : ''} flex-grow`}
                >
                  Upcoming Exams
                </TabsTrigger>
                <TabsTrigger
                  id="previous-tab" 
                  value="previous"
                  className={`${isMobile ? 'text-sm py-1 px-2' : ''} flex-grow`}
                >
                  Previous Exams
                </TabsTrigger>
                <TabsTrigger
                  id="generate-exam-tab"
                  value="generate"
                  className={`${isMobile ? 'text-sm py-1 px-2' : ''} flex-grow`}
                >
                  Generate Exam
                </TabsTrigger>
                <TabsTrigger
                  id="performance-tab"
                  value="performance"
                  className={`${isMobile ? 'text-sm py-1 px-2' : ''} flex-grow`}
                >
                  Performance
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="upcoming" className="space-y-4">
              <Suspense fallback={<div>Loading...</div>}>
                <UpcomingExamsTab
                  exams={exams.filter((exam) => exam.isActive)}
                  onDeleteExam={handleDeleteExam}
                  onEditExam={handleEditExam}
                  onDuplicateExam={handleDuplicateExam}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="previous" className="space-y-4">
              <Suspense fallback={<div>Loading...</div>}>
                <PreviousExamsTab
                  exams={exams.filter((exam) => !exam.isActive)}
                  onDeleteExam={handleDeleteExam}
                  onEditExam={handleEditExam}
                  onDuplicateExam={handleDuplicateExam}
                />
              </Suspense>
            </TabsContent>

            <TabsContent value="generate" className="space-y-4">
              <Suspense fallback={<div>Loading...</div>}>
                <GenerateExamTab onSaveExam={handleAddExam} />
              </Suspense>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Suspense fallback={<div>Loading...</div>}>
                <PerformanceTab completedExams={completedExams} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamTabs;
