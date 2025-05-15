
import React, { useState, useRef } from "react";
import { ParsedQuestionItem, parseQuestions } from "./utils/examParser";
import { IExam } from "@/components/ExamTabs";
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import HandwrittenAnswerUpload from "./HandwrittenAnswerUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMobile } from "@/hooks/use-mobile";
import { AnimatedAspectRatio } from "@/components/ui/aspect-ratio";
import { motion } from "framer-motion";

interface ExamSectionedRendererProps {
  exam: IExam;
  onExamWindowOpen?: (window: Window) => void;
}

interface Answer {
  questionId: number;
  value: string | number;
}

interface Section {
  id: string;
  title: string;
  type: string;
  questions: ParsedQuestionItem[];
}

const ExamSectionedRenderer = ({ exam }: ExamSectionedRendererProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestionItem[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentQuestionForUpload, setCurrentQuestionForUpload] = useState<number | null>(null);
  const { toast } = useToast();
  const isMobile = useMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  
  // Parse questions and organize them into sections
  const initializeExam = () => {
    try {
      if (!exam.questions) {
        toast({
          title: "No Questions Available",
          description: "This exam has no questions. Try generating the exam again.",
          variant: "destructive"
        });
        return;
      }
      
      const questions = parseQuestions(exam.questions);
      setParsedQuestions(questions);
      
      // Group questions by type into sections
      const mcqQuestions = questions.filter(q => q.type === 'mcq');
      const trueFalseQuestions = questions.filter(q => q.type === 'truefalse');
      const shortAnswerQuestions = questions.filter(q => q.type === 'shortanswer');
      const essayQuestions = questions.filter(q => q.type === 'essay');
      
      const examSections: Section[] = [];
      
      if (mcqQuestions.length > 0) {
        examSections.push({
          id: "mcq",
          title: "Multiple Choice Questions (MCQ)",
          type: "mcq",
          questions: mcqQuestions
        });
      }
      
      if (trueFalseQuestions.length > 0) {
        examSections.push({
          id: "truefalse",
          title: "True / False Questions",
          type: "truefalse",
          questions: trueFalseQuestions
        });
      }
      
      if (shortAnswerQuestions.length > 0) {
        examSections.push({
          id: "shortanswer",
          title: "Short Answer Questions",
          type: "shortanswer",
          questions: shortAnswerQuestions
        });
      }
      
      if (essayQuestions.length > 0) {
        examSections.push({
          id: "essay",
          title: "Essay Type Questions",
          type: "essay",
          questions: essayQuestions
        });
      }
      
      setSections(examSections);
      
      // Set active section to the first one if available
      if (examSections.length > 0) {
        setActiveSection(examSections[0].id);
      }
      
      setIsOpen(true);
    } catch (error) {
      console.error("Error initializing exam:", error);
      toast({
        title: "Error Loading Exam",
        description: "There was a problem initializing the exam questions.",
        variant: "destructive"
      });
    }
  };
  
  // Handle exam view action
  const handleViewExam = () => {
    if (!exam.isActive) {
      toast({
        title: "Exam Not Available",
        description: "This exam will be available at the scheduled date and time.",
        variant: "destructive"
      });
      return;
    }
    
    initializeExam();
  };
  
  // Change the active section
  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    if (isMobile) {
      setShowSidebar(false);
    }
  };
  
  // Handle answer changes
  const handleAnswerChange = (questionId: number, value: string | number) => {
    setAnswers(prev => {
      const existingAnswer = prev.find(a => a.questionId === questionId);
      if (existingAnswer) {
        return prev.map(a => a.questionId === questionId ? { ...a, value } : a);
      } else {
        return [...prev, { questionId, value }];
      }
    });
  };
  
  // Handle image upload for handwritten answers
  const handleImageUploadClick = (questionId: number) => {
    setCurrentQuestionForUpload(questionId);
    setUploadDialogOpen(true);
  };
  
  // Handle text extraction from handwritten images
  const handleTextExtracted = (text: string) => {
    if (currentQuestionForUpload !== null) {
      handleAnswerChange(currentQuestionForUpload, text);
      setUploadDialogOpen(false);
      
      toast({
        title: "Text Extracted",
        description: "Your handwritten answer has been processed and added to the text field.",
      });
    }
  };
  
  // Get current answer value
  const getAnswerValue = (questionId: number): string | number | undefined => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer?.value;
  };
  
  // Get active section questions
  const getActiveSectionQuestions = (): ParsedQuestionItem[] => {
    const section = sections.find(s => s.id === activeSection);
    return section?.questions || [];
  };
  
  // Render specific question type
  const renderQuestion = (question: ParsedQuestionItem, index: number) => {
    const questionNumber = `Q${index + 1}`;
    
    switch (question.type) {
      case 'mcq':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{questionNumber}: {question.question}</p>
            <RadioGroup 
              value={getAnswerValue(question.id)?.toString()} 
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-3"
            >
              {question.options?.map((option, optIndex) => (
                <div key={optIndex} className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent">
                  <RadioGroupItem value={optIndex.toString()} id={`q${question.id}-opt${optIndex}`} />
                  <label htmlFor={`q${question.id}-opt${optIndex}`} className="flex-grow cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );
        
      case 'truefalse':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{questionNumber}: {question.question}</p>
            <RadioGroup 
              value={getAnswerValue(question.id)?.toString()} 
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent">
                <RadioGroupItem value="true" id={`q${question.id}-true`} />
                <label htmlFor={`q${question.id}-true`} className="flex-grow cursor-pointer">True</label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-lg hover:bg-accent">
                <RadioGroupItem value="false" id={`q${question.id}-false`} />
                <label htmlFor={`q${question.id}-false`} className="flex-grow cursor-pointer">False</label>
              </div>
            </RadioGroup>
          </div>
        );
        
      case 'shortanswer':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{questionNumber}: {question.question}</p>
            <div className="space-y-2">
              <input
                type="text"
                value={getAnswerValue(question.id)?.toString() || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full p-3 border rounded-lg"
              />
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleImageUploadClick(question.id)}
              >
                <Upload className="h-4 w-4" />
                Upload Handwritten Answer
              </Button>
            </div>
          </div>
        );
        
      case 'essay':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{questionNumber}: {question.question}</p>
            <div className="space-y-2">
              <textarea
                value={getAnswerValue(question.id)?.toString() || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                placeholder="Write your essay answer here..."
                className="w-full h-40 p-3 border rounded-lg resize-y"
              />
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleImageUploadClick(question.id)}
              >
                <Upload className="h-4 w-4" />
                Upload Handwritten Answer
              </Button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 border rounded-lg bg-muted">
            <p>Unsupported question type</p>
          </div>
        );
    }
  };

  // Toggle sidebar visibility on mobile
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };
  
  const activeSectionQuestions = getActiveSectionQuestions();
  const activeTitle = sections.find(s => s.id === activeSection)?.title || "Questions";
  
  if (!isOpen) {
    // Return early with the action button
    return {
      handleViewExam,
    };
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row h-full gap-4">
        {/* Mobile toggle button */}
        {isMobile && (
          <Button 
            variant="outline" 
            size="icon" 
            className="md:hidden absolute top-4 left-4 z-10"
            onClick={toggleSidebar}
          >
            {showSidebar ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        )}
        
        {/* Left Panel - Section Navigation */}
        {showSidebar && (
          <motion.div 
            initial={{ x: isMobile ? -300 : 0 }}
            animate={{ x: 0 }}
            className="w-full md:w-1/4 bg-background border-r flex-shrink-0"
          >
            <div className="p-4 sticky top-0">
              <h2 className="text-xl font-semibold mb-4">{exam.name}</h2>
              <p className="text-sm text-muted-foreground mb-6">Sections</p>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? "default" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => handleSectionChange(section.id)}
                  >
                    {section.title}
                  </Button>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
        
        {/* Right Panel - Questions */}
        <div className={`flex-grow overflow-y-auto p-4 ${showSidebar ? 'md:w-3/4' : 'w-full'}`}>
          <div className="bg-background rounded-lg">
            <div className="sticky top-0 bg-background z-10 p-4 border-b">
              <h3 className="text-xl font-semibold">{activeTitle}</h3>
            </div>
            
            <div className="p-4 space-y-8">
              {activeSectionQuestions.length > 0 ? (
                activeSectionQuestions.map((question, index) => (
                  <Card key={question.id} className="p-4">
                    <CardContent className="pt-4">
                      {renderQuestion(question, index)}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No questions available in this section.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Handwritten answer upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Handwritten Answer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Take a photo of your handwritten answer and upload it. We'll extract the text and add it to your answer.
            </p>
            <HandwrittenAnswerUpload onTextExtracted={handleTextExtracted} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExamSectionedRenderer;
