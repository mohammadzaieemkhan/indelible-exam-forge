
import React, { useState, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExamHandwrittenUploadHandler from './exam/ExamHandwrittenUploadHandler';

// Import all tab components
import UpcomingExamsTab from './tabs/UpcomingExamsTab';
import GenerateExamTab from './tabs/GenerateExamTab';
import PreviousExamsTab from './tabs/PreviousExamsTab';
import PerformanceTab from './tabs/PerformanceTab';

// Define and export the IExam interface
export interface IExam {
  id?: string;
  name: string;
  date: string;
  time: string;
  duration: number;
  numberOfQuestions: number;
  topics: string[];
  difficulty: string;
  questionTypes: string;
  isActive: boolean;
  questions?: string;
  sections?: any[]; // Add this property
  questionWeights?: { // Add this property
    mcq?: number;
    truefalse?: number;
    shortanswer?: number;
    essay?: number;
    [key: string]: number | undefined;
  };
}

// Main ExamTabs component
const ExamTabs: React.FC<{
  onExamWindowOpen?: (examWindow: Window) => void
}> = ({ onExamWindowOpen }) => {
  // State for managing exams
  const [upcomingExams, setUpcomingExams] = useState<IExam[]>([]);
  const [previousExams, setPreviousExams] = useState<IExam[]>([]);
  const [generatedExam, setGeneratedExam] = useState<IExam | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming-exams");
  
  // Ref for exam window
  const examWindowRef = useRef<Window | null>(null);
  
  // Function to be called when opening the exam window
  const handleExamWindowOpen = (examWindow: Window) => {
    examWindowRef.current = examWindow;
    if (onExamWindowOpen) {
      onExamWindowOpen(examWindow);
    }
  };

  // Load exams from localStorage on component mount
  React.useEffect(() => {
    try {
      const savedUpcomingExams = localStorage.getItem('upcomingExams');
      const savedPreviousExams = localStorage.getItem('previousExams');
      
      if (savedUpcomingExams) {
        setUpcomingExams(JSON.parse(savedUpcomingExams));
      }
      
      if (savedPreviousExams) {
        setPreviousExams(JSON.parse(savedPreviousExams));
      }
    } catch (error) {
      console.error("Error loading exams from localStorage:", error);
    }
  }, []);

  // Save exams to localStorage whenever they change
  React.useEffect(() => {
    if (upcomingExams.length > 0) {
      localStorage.setItem('upcomingExams', JSON.stringify(upcomingExams));
    }
    
    if (previousExams.length > 0) {
      localStorage.setItem('previousExams', JSON.stringify(previousExams));
    }
  }, [upcomingExams, previousExams]);

  // Handle saving a new exam
  const handleSaveExam = (exam: IExam) => {
    const newExam = {
      ...exam,
      id: `exam-${Date.now()}`, // Generate a unique ID
    };
    
    setUpcomingExams([...upcomingExams, newExam]);
    setGeneratedExam(null);
    setActiveTab("upcoming-exams");
  };

  // Handle deleting an exam
  const handleDeleteExam = (examId: string) => {
    setUpcomingExams(upcomingExams.filter(exam => exam.id !== examId));
  };

  // Handle editing an exam
  const handleEditExam = (examId: string) => {
    // Find the exam to edit
    const examToEdit = upcomingExams.find(exam => exam.id === examId);
    if (examToEdit) {
      // Set it as the generated exam for editing
      setGeneratedExam(examToEdit);
      // Remove it from upcoming exams
      setUpcomingExams(upcomingExams.filter(exam => exam.id !== examId));
      // Switch to generate tab
      setActiveTab("generate-exam");
    }
  };

  // Handle duplicating an exam
  const handleDuplicateExam = (examId: string) => {
    const examToDuplicate = upcomingExams.find(exam => exam.id === examId);
    if (examToDuplicate) {
      const duplicatedExam = {
        ...examToDuplicate,
        id: `exam-${Date.now()}`,
        name: `${examToDuplicate.name} (Copy)`
      };
      setUpcomingExams([...upcomingExams, duplicatedExam]);
    }
  };

  return (
    <>
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full grid-cols-2 sm:grid-cols-4 grid">
          <TabsTrigger id="upcoming-exam-tab" value="upcoming-exams">Upcoming</TabsTrigger>
          <TabsTrigger id="generate-exam-tab" value="generate-exam">Generate</TabsTrigger>
          <TabsTrigger id="previous-exams-tab" value="previous-exams">Previous</TabsTrigger>
          <TabsTrigger id="performance-tab" value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming-exams" className="mt-6">
          <UpcomingExamsTab 
            exams={upcomingExams}
            onDeleteExam={handleDeleteExam}
            onEditExam={handleEditExam}
            onDuplicateExam={handleDuplicateExam}
          />
        </TabsContent>

        <TabsContent value="generate-exam" className="mt-6">
          <GenerateExamTab 
            onSaveExam={handleSaveExam}
            generatedExam={generatedExam}
            setGeneratedExam={setGeneratedExam}
          />
        </TabsContent>

        <TabsContent value="previous-exams" className="mt-6">
          <PreviousExamsTab exams={previousExams} />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceTab examData={[...upcomingExams, ...previousExams]} />
        </TabsContent>
      </Tabs>
      
      {/* Add the handwritten upload handler */}
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </>
  );
};

export default ExamTabs;
