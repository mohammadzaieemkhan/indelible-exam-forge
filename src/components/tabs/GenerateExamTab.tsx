
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
import { useToast } from "@/hooks/use-toast";
import { useGeminiAI } from "@/utils/apiService";
import ExamSection from "@/components/ExamSection";
import SyllabusUploader from "@/components/SyllabusUploader";
import { IExam } from "@/components/ExamTabs";

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
  const [examDuration, setExamDuration] = useState<string>("60");
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState<string>("");
  const [syllabusContent, setSyllabusContent] = useState<string>("");
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);

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
  
  // Difficulty (for non-section mode)
  const [difficulty, setDifficulty] = useState({
    easy: true,
    medium: true,
    hard: false
  });
  
  // Number of questions (for non-section mode)
  const [numberOfQuestions, setNumberOfQuestions] = useState<string>("10");
  
  const { toast } = useToast();
  
  // Check if the form is valid for generation
  const isGenerateButtonDisabled = isGeneratingQuestions || 
    (useSections && sections.length === 0) || 
    topics.length === 0;

  // Get the reason why the button is disabled
  const getDisabledReason = () => {
    if (isGeneratingQuestions) return "Generating questions...";
    if (topics.length === 0) return "At least one topic is required";
    if (useSections && sections.length === 0) return "At least one section is required when sections are enabled";
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
  
  // Handle adding a new section
  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        title: `Section ${sections.length + 1}`,
        topics: [...topics], // Copy the global topics
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
  };
  
  // Handle getting syllabus content
  const handleSyllabusContent = (content: string) => {
    setSyllabusContent(content);
  };
  
  // Handle exam generation
  const handleGenerateExam = async () => {
    setIsGeneratingQuestions(true);
    
    try {
      // Validate that we have topics
      if (topics.length === 0) {
        toast({
          title: "Missing Topics",
          description: "Please add at least one topic for your exam",
          variant: "destructive",
        });
        setIsGeneratingQuestions(false);
        return;
      }

      let params: any = {
        task: "generate_questions"
      };
      
      if (useSections && sections.length > 0) {
        // Generate questions based on sections
        params.sections = sections;
      } else {
        // Generate questions based on global settings
        // Get difficulty level
        const difficultyLevels = [];
        if (difficulty.easy) difficultyLevels.push('easy');
        if (difficulty.medium) difficultyLevels.push('medium'); 
        if (difficulty.hard) difficultyLevels.push('hard');
        const difficultyString = difficultyLevels.join(', ');
        
        // Get selected question types
        const selectedQuestionTypes = Object.entries(questionTypes)
          .filter(([_, value]) => value)
          .map(([key, _]) => key);
        
        if (selectedQuestionTypes.length === 0) {
          throw new Error("Please select at least one question type");
        }
        
        params = {
          ...params,
          topics: topics,
          difficulty: difficultyString || "medium",
          questionTypes: selectedQuestionTypes,
          numberOfQuestions: parseInt(numberOfQuestions) || 10,
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
          date: examDate || "2025-05-15",
          time: examTime,
          duration: examDuration,
          numberOfQuestions,
          topics: topics,
          difficulty: Object.entries(difficulty)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)
            .join(", "),
          questionTypes: Object.entries(questionTypes)
            .filter(([_, value]) => value)
            .map(([key, _]) => key)
            .join(", "),
          questions: result.response,
          sections: useSections ? sections : []
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
              <Label>Exam Date</Label>
              <Input 
                type="date" 
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full mt-1" 
              />
            </div>
            <div>
              <Label>Exam Time</Label>
              <Input 
                type="time" 
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full mt-1" 
              />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  min={15}
                  max={180}
                  step={5}
                  className="flex-1"
                  value={[parseInt(examDuration)]}
                  onValueChange={(value) => setExamDuration(value[0].toString())}
                />
                <Input
                  type="number"
                  className="w-20"
                  min={15}
                  max={180}
                  value={examDuration}
                  onChange={(e) => setExamDuration(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Step 2: Syllabus Input */}
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
        
        {/* Step 3: Exam Configuration */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step 3: Question Configuration</h3>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="use-sections" 
              checked={useSections}
              onCheckedChange={(checked) => setUseSections(!!checked)}
            />
            <Label htmlFor="use-sections" className="font-medium">Enable Exam Sections</Label>
          </div>
          
          {useSections && sections.length === 0 && (
            <Alert variant="warning" className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
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
                      value={[parseInt(numberOfQuestions)]}
                      onValueChange={(value) => setNumberOfQuestions(value[0].toString())}
                    />
                    <Input
                      type="number"
                      className="w-20"
                      min={1}
                      max={50}
                      value={numberOfQuestions}
                      onChange={(e) => setNumberOfQuestions(e.target.value)}
                    />
                  </div>
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
                
                <div>
                  <Label>Difficulty</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="easy" 
                        checked={difficulty.easy}
                        onCheckedChange={(checked) => 
                          setDifficulty({...difficulty, easy: !!checked})
                        }
                      />
                      <Label htmlFor="easy">Easy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="medium" 
                        checked={difficulty.medium}
                        onCheckedChange={(checked) => 
                          setDifficulty({...difficulty, medium: !!checked})
                        }
                      />
                      <Label htmlFor="medium">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hard" 
                        checked={difficulty.hard}
                        onCheckedChange={(checked) => 
                          setDifficulty({...difficulty, hard: !!checked})
                        }
                      />
                      <Label htmlFor="hard">Hard</Label>
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
