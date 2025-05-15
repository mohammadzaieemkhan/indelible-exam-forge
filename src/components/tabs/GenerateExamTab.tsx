
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useGeminiAI } from "@/utils/apiService";
import { IExam } from "@/components/ExamTabs";

// Import refactored components
import ExamBasicInfo from "@/components/exam-generation/ExamBasicInfo";
import TopicsInput from "@/components/exam-generation/TopicsInput";
import SectionConfiguration from "@/components/exam-generation/SectionConfiguration";
import BasicConfiguration from "@/components/exam-generation/BasicConfiguration";
import QuestionWeightage from "@/components/exam-generation/QuestionWeightage";
import GenerateButton from "@/components/exam-generation/GenerateButton";
import SyllabusUploaderSection from "@/components/exam-generation/SyllabusUploaderSection";

interface GenerateExamTabProps {
  onSaveExam: (exam: IExam) => void;
  generatedExam: IExam | null;
  setGeneratedExam: (exam: IExam | null) => void;
}

const GenerateExamTab = ({ onSaveExam, generatedExam, setGeneratedExam }: GenerateExamTabProps) => {
  // Form states
  const [examName, setExamName] = useState<string>("New Exam");
  const [examDate, setExamDate] = useState<string>("");
  const [examTime, setExamTime] = useState<string>("10:00");
  const [examDuration, setExamDuration] = useState<number>(60);
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState<string>("");
  const [syllabusContent, setSyllabusContent] = useState<string>("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  
  // Form validation errors
  const [formErrors, setFormErrors] = useState<{
    date?: string;
    time?: string;
  }>({});

  // Section management
  const [sections, setSections] = useState<any[]>([]);
  const [useSections, setUseSections] = useState<boolean>(false);
  
  // Question type preferences (for non-section mode)
  const [questionTypes, setQuestionTypes] = useState({
    mcq: true,
    truefalse: false,
    shortanswer: false,
    essay: false
  });
  
  // Question weights (for performance analysis)
  const [questionWeights, setQuestionWeights] = useState({
    mcq: 1,
    truefalse: 1,
    shortanswer: 2,
    essay: 3
  });
  
  // Difficulty (for non-section mode)
  const [difficultyLevel, setDifficultyLevel] = useState<string>("medium");
  
  // Number of questions (for non-section mode)
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);

  const { toast } = useToast();
  
  // Check if the form is valid for generation
  const isGenerateButtonDisabled = isGeneratingQuestions || 
    (useSections && sections.length === 0) || 
    (!useSections && topics.length === 0) ||
    !examDate ||
    !examTime;

  // Get the reason why the button is disabled
  const getDisabledReason = () => {
    if (isGeneratingQuestions) return "Generating questions...";
    if (!examDate) return "Exam date is required";
    if (!examTime) return "Exam time is required";
    if (useSections && sections.length === 0) return "At least one section is required when sections are enabled";
    if (!useSections && topics.length === 0) return "At least one topic is required";
    return "";
  };
  
  // Handle adding a new topic
  const handleAddTopic = () => {
    if (newTopic && !topics.includes(newTopic)) {
      setTopics([...topics, newTopic]);
      setNewTopic("");
    }
  };

  // Handle removing a topic
  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };
  
  // Handle question type toggle
  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    setQuestionTypes({
      ...questionTypes,
      [type]: checked
    });
  };
  
  // Handle question weight change
  const handleQuestionWeightChange = (type: string, weight: number) => {
    setQuestionWeights({
      ...questionWeights,
      [type]: weight
    });
  };
  
  // Handle adding a new section
  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        title: `Section ${sections.length + 1}`,
        topics: [],
        questionTypes: ["mcq"],
        numberOfQuestions: 5,
        difficulty: "medium"
      }
    ]);
  };
  
  // Handle updating a section
  const handleUpdateSection = (sectionIndex: number, updatedSection: any) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex] = updatedSection;
    setSections(updatedSections);
  };
  
  // Handle removing a section
  const handleRemoveSection = (sectionIndex: number) => {
    setSections(sections.filter((_, index) => index !== sectionIndex));
  };
  
  // Handle getting topics from syllabus uploader
  const handleTopicsExtracted = (extractedTopics: string[]) => {
    setTopics([...new Set([...topics, ...extractedTopics])]);
    
    // Also distribute to sections if they exist
    if (useSections && sections.length > 0) {
      // Add extracted topics to the first section
      const updatedSections = [...sections];
      updatedSections[0] = {
        ...updatedSections[0],
        topics: [...new Set([...updatedSections[0].topics, ...extractedTopics])]
      };
      setSections(updatedSections);
    }
  };
  
  // Handle getting syllabus content
  const handleSyllabusContent = (content: string) => {
    setSyllabusContent(content);
  };

  // Update the slider handlers to use numbers
  const handleDurationChange = (value: number[]) => {
    setExamDuration(value[0]);
  };

  const handleNumberOfQuestionsChange = (value: number[]) => {
    setNumberOfQuestions(value[0]);
  };

  // Update the input handlers to convert strings to numbers
  const handleDurationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setExamDuration(isNaN(value) ? 60 : value);
  };

  const handleNumberOfQuestionsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setNumberOfQuestions(isNaN(value) ? 10 : value);
  };
  
  // Handle date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExamDate(e.target.value);
    setFormErrors(prev => ({...prev, date: undefined}));
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExamTime(e.target.value);
    setFormErrors(prev => ({...prev, time: undefined}));
  };
  
  // Handle exam generation
  const handleGenerateExam = async () => {
    // Validate required fields
    const errors: {
      date?: string;
      time?: string;
    } = {};

    if (!examDate) {
      errors.date = "Exam date is required";
    }

    if (!examTime) {
      errors.time = "Exam time is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingQuestions(true);
    
    try {
      // Validate that we have topics or sections with topics
      if (!useSections && topics.length === 0) {
        toast({
          title: "Missing Topics",
          description: "Please add at least one topic for your exam",
          variant: "destructive",
        });
        setIsGeneratingQuestions(false);
        return;
      }
      
      if (useSections && sections.length === 0) {
        toast({
          title: "Missing Sections",
          description: "Please add at least one section for your exam",
          variant: "destructive",
        });
        setIsGeneratingQuestions(false);
        return;
      }
      
      // Validate that each section has at least one topic if using sections
      if (useSections) {
        const sectionsWithoutTopics = sections.filter(section => section.topics.length === 0);
        if (sectionsWithoutTopics.length > 0) {
          toast({
            title: "Missing Topics in Sections",
            description: `Please add at least one topic to each section. ${sectionsWithoutTopics.length} section(s) have no topics.`,
            variant: "destructive",
          });
          setIsGeneratingQuestions(false);
          return;
        }
      }

      let params: any = {
        task: "generate_questions"
      };
      
      if (useSections && sections.length > 0) {
        // Generate questions based on sections
        params.sections = sections.map(section => ({
          ...section,
          questionWeights: section.questionTypes.reduce((acc: any, type: string) => {
            acc[type] = questionWeights[type as keyof typeof questionWeights] || 1;
            return acc;
          }, {})
        }));
      } else {
        // Generate questions based on global settings
        // Get selected question types
        const selectedQuestionTypes = Object.entries(questionTypes)
          .filter(([_, value]) => value)
          .map(([key, _]) => key);
        
        if (selectedQuestionTypes.length === 0) {
          throw new Error("Please select at least one question type");
        }

        // For auto-sectioning when multiple question types are selected
        const shouldAutoSection = selectedQuestionTypes.length > 1;
        
        params = {
          ...params,
          topics: topics,
          difficulty: difficultyLevel || "medium",
          questionTypes: selectedQuestionTypes,
          numberOfQuestions: numberOfQuestions,
          questionWeights: questionWeights,
          organizeBySections: shouldAutoSection
        };
      }
      
      // Add syllabus content if available
      if (syllabusContent) {
        params.syllabusContent = syllabusContent;
      }
      
      // Log the parameters for debugging
      console.log("Generating exam with params:", params);
      
      // Call Gemini AI via our edge function
      const result = await useGeminiAI(params);
      
      if (result.success && result.response) {
        // Create exam object to save
        const newExam: IExam = {
          name: examName,
          date: examDate,
          time: examTime,
          duration: examDuration,
          numberOfQuestions,
          topics: useSections ? 
            sections.flatMap(section => section.topics) : 
            topics,
          difficulty: difficultyLevel,
          questionTypes: Object.entries(questionTypes)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)
            .join(", "),
          questions: result.response,
          sections: useSections ? sections : [],
          questionWeights,
          isActive: false
        };
        
        // Direct save to upcoming exams without showing preview
        onSaveExam(newExam);
        
        toast({
          title: "Success",
          description: "Exam created and moved to upcoming exams",
        });
        
        // Reset form
        setExamName("New Exam");
        setExamDate("");
        setExamTime("10:00");
        setTopics([]);
      } else {
        throw new Error(result.error || "Failed to generate questions");
      }
    } catch (error) {
      console.error("Error generating exam:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate exam questions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate New Exam</CardTitle>
        <CardDescription>Create a customized exam based on your syllabus</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Basic Exam Info */}
        <ExamBasicInfo
          examName={examName}
          setExamName={setExamName}
          examDate={examDate}
          setExamDate={setExamDate}
          examTime={examTime}
          setExamTime={setExamTime}
          examDuration={examDuration}
          setExamDuration={setExamDuration}
          formErrors={formErrors}
          handleDateChange={handleDateChange}
          handleTimeChange={handleTimeChange}
          handleDurationChange={handleDurationChange}
          handleDurationInputChange={handleDurationInputChange}
        />
        
        {/* Step 2: Syllabus Input - Only show when not using sections */}
        {!useSections && (
          <TopicsInput
            topics={topics}
            setTopics={setTopics}
            onTopicsExtracted={handleTopicsExtracted}
            onSyllabusContent={handleSyllabusContent}
          />
        )}
        
        {/* Step 2/3: File Upload for Section Mode */}
        {useSections && (
          <SyllabusUploaderSection
            onTopicsExtracted={handleTopicsExtracted}
            onSyllabusContent={handleSyllabusContent}
          />
        )}
        
        {/* Step 3: Exam Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step {useSections ? "3" : "3"}: Question Configuration</h3>
          
          <SectionConfiguration
            useSections={useSections}
            setUseSections={setUseSections}
            sections={sections}
            handleAddSection={handleAddSection}
            handleUpdateSection={handleUpdateSection}
            handleRemoveSection={handleRemoveSection}
            availableTopics={topics}
          />
          
          {!useSections && (
            <BasicConfiguration
              numberOfQuestions={numberOfQuestions}
              handleNumberOfQuestionsChange={handleNumberOfQuestionsChange}
              handleNumberOfQuestionsInputChange={handleNumberOfQuestionsInputChange}
              difficultyLevel={difficultyLevel}
              setDifficultyLevel={setDifficultyLevel}
              questionTypes={questionTypes}
              handleQuestionTypeChange={handleQuestionTypeChange}
            />
          )}
        </div>
        
        {/* Step 4: Question Weightage */}
        <QuestionWeightage
          questionWeights={questionWeights}
          handleQuestionWeightChange={handleQuestionWeightChange}
        />
        
        {/* Generate Button */}
        <GenerateButton
          isGeneratingQuestions={isGeneratingQuestions}
          isDisabled={isGenerateButtonDisabled}
          disabledReason={getDisabledReason()}
          onGenerate={handleGenerateExam}
        />
      </CardContent>
    </Card>
  );
};

export default GenerateExamTab;
