import { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useGeminiAI } from "@/utils/apiService";
import ExamSection from "@/components/ExamSection";
import SyllabusUploader from "@/components/SyllabusUploader";
import { IExam } from "@/components/ExamTabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

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
  const [examDuration, setExamDuration] = useState<number>(60); // Changed from string to number
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
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10); // Changed from string to number

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
        topics: [], // Start with empty topics for each section
        questionTypes: ["mcq"], // Default to MCQs
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
          numberOfQuestions: parseInt(numberOfQuestions) || 10,
          questionWeights: questionWeights,
          organizeBySections: shouldAutoSection // Add this flag for auto-sectioning
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
          isActive: false // Add the missing isActive property
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
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step 1: Exam Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Exam Name</Label>
              <Input 
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full mt-1" 
              />
            </div>
            <div>
              <Label className="flex items-center">
                Exam Date <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                type="date" 
                value={examDate}
                onChange={handleDateChange}
                className={cn("w-full mt-1", formErrors.date && "border-red-500")}
              />
              {formErrors.date && (
                <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>
              )}
            </div>
            <div>
              <Label className="flex items-center">
                Exam Time <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input 
                type="time" 
                value={examTime}
                onChange={handleTimeChange}
                className={cn("w-full mt-1", formErrors.time && "border-red-500")}
              />
              {formErrors.time && (
                <p className="text-xs text-red-500 mt-1">{formErrors.time}</p>
              )}
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  min={15}
                  max={180}
                  step={5}
                  className="flex-1"
                  value={[examDuration]}
                  onValueChange={handleDurationChange}
                />
                <Input
                  type="number"
                  className="w-20"
                  min={15}
                  max={180}
                  value={examDuration}
                  onChange={handleDurationInputChange}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 2: Syllabus Input - Only show when not using sections */}
        {!useSections && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-1">
              Step 2: Syllabus Input 
              <span className="text-sm font-medium text-red-500">*</span>
            </h3>
            
            {topics.length === 0 && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  At least one topic is required to generate an exam
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Topic Input */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium flex items-center gap-1">
                    Topics
                    <span className="text-sm font-medium text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md mt-1 min-h-[100px]">
                    {topics.map((topic, index) => (
                      <div key={index} className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2">
                        {topic}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTopic(topic)} 
                          className="hover:text-destructive"
                        >×</button>
                      </div>
                    ))}
                    <Input 
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                      className="flex-1 min-w-[100px] border-none p-0 h-8" 
                      placeholder="Add topic..." 
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      Enter topics and press Enter to add them
                    </p>
                    {newTopic && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAddTopic} 
                        className="text-xs h-7 px-2"
                      >
                        Add Topic
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right: File Upload */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Upload Syllabus (Optional)</label>
                  <SyllabusUploader 
                    onTopicsExtracted={handleTopicsExtracted}
                    onSyllabusContent={handleSyllabusContent}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 2/3: File Upload for Section Mode */}
        {useSections && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Step 2: Syllabus Upload (Optional)</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Upload Syllabus</label>
                <SyllabusUploader 
                  onTopicsExtracted={handleTopicsExtracted}
                  onSyllabusContent={handleSyllabusContent}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Extracted topics will be available to add to your sections
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Exam Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step {useSections ? "3" : "3"}: Question Configuration</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-sections" 
              checked={useSections}
              onCheckedChange={(checked) => setUseSections(!!checked)}
            />
            <Label htmlFor="use-sections" className="font-medium">Enable Exam Sections</Label>
          </div>
          
          {useSections && sections.length === 0 && (
            <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                When sections are enabled, you need to add at least one section
              </AlertDescription>
            </Alert>
          )}
          
          {!useSections ? (
            // Non-Section Mode
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Number of Questions</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      min={1}
                      max={50}
                      step={1}
                      className="flex-1"
                      value={[numberOfQuestions]}
                      onValueChange={handleNumberOfQuestionsChange}
                    />
                    <Input
                      type="number"
                      className="w-20"
                      min={1}
                      max={50}
                      value={numberOfQuestions}
                      onChange={handleNumberOfQuestionsInputChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Difficulty</Label>
                  <RadioGroup 
                    value={difficultyLevel}
                    onValueChange={setDifficultyLevel} 
                    className="flex flex-row gap-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy">Easy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hard" id="hard" />
                      <Label htmlFor="hard">Hard</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Question Types</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="mcq" 
                        checked={questionTypes.mcq}
                        onCheckedChange={(checked) => 
                          handleQuestionTypeChange('mcq', !!checked)
                        }
                      />
                      <Label htmlFor="mcq">Multiple Choice Questions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="truefalse" 
                        checked={questionTypes.truefalse}
                        onCheckedChange={(checked) => 
                          handleQuestionTypeChange('truefalse', !!checked)
                        }
                      />
                      <Label htmlFor="truefalse">True/False Questions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="shortanswer" 
                        checked={questionTypes.shortanswer}
                        onCheckedChange={(checked) => 
                          handleQuestionTypeChange('shortanswer', !!checked)
                        }
                      />
                      <Label htmlFor="shortanswer">Short Answer Questions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="essay" 
                        checked={questionTypes.essay}
                        onCheckedChange={(checked) => 
                          handleQuestionTypeChange('essay', !!checked)
                        }
                      />
                      <Label htmlFor="essay">Essay Questions</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Section Mode
            <div className="space-y-4">
              {sections.map((section, index) => (
                <ExamSection
                  key={index}
                  sectionIndex={index}
                  section={section}
                  availableTopics={topics}
                  onUpdate={handleUpdateSection}
                  onRemove={handleRemoveSection}
                />
              ))}
              
              <Button 
                variant="outline" 
                onClick={handleAddSection}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Section
              </Button>
            </div>
          )}
        </div>
        
        {/* Step 4: Question Weightage */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step {useSections ? "4" : "4"}: Question Weightage</h3>
          <p className="text-sm text-muted-foreground">
            Set the weightage for each question type for performance analysis
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>MCQ Weightage</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  value={[questionWeights.mcq]}
                  onValueChange={(value) => handleQuestionWeightChange('mcq', value[0])}
                />
                <div className="w-10 text-center">{questionWeights.mcq}</div>
              </div>
            </div>
            
            <div>
              <Label>True/False Weightage</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  value={[questionWeights.truefalse]}
                  onValueChange={(value) => handleQuestionWeightChange('truefalse', value[0])}
                />
                <div className="w-10 text-center">{questionWeights.truefalse}</div>
              </div>
            </div>
            
            <div>
              <Label>Short Answer Weightage</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  value={[questionWeights.shortanswer]}
                  onValueChange={(value) => handleQuestionWeightChange('shortanswer', value[0])}
                />
                <div className="w-10 text-center">{questionWeights.shortanswer}</div>
              </div>
            </div>
            
            <div>
              <Label>Essay Weightage</Label>
              <div className="flex items-center gap-4 mt-2">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                  value={[questionWeights.essay]}
                  onValueChange={(value) => handleQuestionWeightChange('essay', value[0])}
                />
                <div className="w-10 text-center">{questionWeights.essay}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Generate Button */}
        <div className="flex flex-col items-center pt-4 space-y-2">
          <Button 
            size="lg" 
            onClick={handleGenerateExam}
            disabled={isGenerateButtonDisabled}
          >
            {isGeneratingQuestions ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              "Generate & Save Exam"
            )}
          </Button>
          
          {isGenerateButtonDisabled && !isGeneratingQuestions && (
            <p className="text-sm text-muted-foreground">
              {getDisabledReason()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GenerateExamTab;
