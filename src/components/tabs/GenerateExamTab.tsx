import React, { useState, useEffect } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IExam } from "@/components/ExamTabs";
import { useGeminiAI } from "@/utils/apiService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { CalendarIcon, LoaderCircle, Sparkles, ListOrdered } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SyllabusUploader from "../SyllabusUploader";

// Define the form schema with Zod
const formSchema = z.object({
  examName: z.string().min(3, "Name must be at least 3 characters"),
  examDate: z.date(),
  examTime: z.string(),
  examDuration: z.string(),
  numberOfQuestions: z.string(),
  topics: z.array(z.string()).min(1, "Select at least one topic"),
  difficulty: z.string(),
  questionTypes: z.string(),
  includeQuestionWeights: z.boolean().optional(),
  // Question type configuration
  mcqCount: z.string().optional(),
  shortAnswerCount: z.string().optional(),
  essayCount: z.string().optional(),
  trueFalseCount: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface GenerateExamTabProps {
  onSaveExam: (exam: IExam) => void;
  generatedExam: IExam | null;
  setGeneratedExam: (exam: IExam | null) => void;
}

const GenerateExamTab = ({
  onSaveExam,
  generatedExam,
  setGeneratedExam,
}: GenerateExamTabProps) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState<string>("");
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<string>("");
  const [examQuestions, setExamQuestions] = useState<string>("");
  const [examSections, setExamSections] = useState<any[]>([]);
  const [questionWeights, setQuestionWeights] = useState<Record<number, number>>({});
  
  // Add state to track which question types are selected
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Create the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      examName: "",
      examDate: new Date(),
      examTime: format(new Date(), "HH:mm"),
      examDuration: "60",
      numberOfQuestions: "10",
      topics: [],
      difficulty: "medium",
      questionTypes: "mixed",
      includeQuestionWeights: false,
      mcqCount: "5",
      shortAnswerCount: "3",
      essayCount: "1",
      trueFalseCount: "1",
    },
  });

  // Auto-update total number of questions when customized distribution changes
  useEffect(() => {
    if (form.watch("questionTypes") === "customized") {
      const mcqCount = parseInt(form.watch("mcqCount") || "0");
      const shortAnswerCount = parseInt(form.watch("shortAnswerCount") || "0");
      const essayCount = parseInt(form.watch("essayCount") || "0");
      const trueFalseCount = parseInt(form.watch("trueFalseCount") || "0");
      
      const totalCount = mcqCount + shortAnswerCount + essayCount + trueFalseCount;
      if (totalCount > 0) {
        form.setValue("numberOfQuestions", totalCount.toString());
      }
    }
  }, [
    form.watch("mcqCount"),
    form.watch("shortAnswerCount"),
    form.watch("essayCount"),
    form.watch("trueFalseCount"),
    form.watch("questionTypes")
  ]);

  // Handle adding custom topics
  const handleAddCustomTopics = () => {
    if (customTopics.trim()) {
      const newTopics = customTopics
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);

      if (newTopics.length > 0) {
        setAvailableTopics(prev => [...prev, ...newTopics]);
        setCustomTopics("");
        toast({
          title: "Topics Added",
          description: `Added ${newTopics.length} custom topics.`,
        });
      }
    }
  };

  // Handle topic selection when clicking on a topic
  const handleTopicClick = (topic: string) => {
    const currentTopics = form.getValues("topics");
    if (currentTopics.includes(topic)) {
      form.setValue("topics", currentTopics.filter(t => t !== topic));
    } else {
      form.setValue("topics", [...currentTopics, topic]);
    }
  };

  // Handle syllabus upload
  const handleSyllabusUpload = (text: string) => {
    setSyllabus(text);
  };

  // Handle extracted topics
  const handleTopicsExtracted = (topics: string[]) => {
    if (topics && topics.length > 0) {
      // Clean up topics - ensure they are plain text without markdown or special characters
      const cleanedTopics = topics.map(topic => 
        topic.replace(/\*\*/g, '')
             .replace(/^\s*[-*•]\s*/, '')
             .trim()
      );
      
      setAvailableTopics(cleanedTopics);
    }
  };

  // Validate customized question counts
  const validateCustomizedQuestions = (values: FormValues): { isValid: boolean; message?: string } => {
    if (values.questionTypes === "customized") {
      const mcqCount = parseInt(values.mcqCount || "0");
      const shortAnswerCount = parseInt(values.shortAnswerCount || "0");
      const essayCount = parseInt(values.essayCount || "0");
      const trueFalseCount = parseInt(values.trueFalseCount || "0");
      
      const totalQuestions = mcqCount + shortAnswerCount + essayCount + trueFalseCount;
      const requestedQuestions = parseInt(values.numberOfQuestions);
      
      if (totalQuestions === 0) {
        return { 
          isValid: false, 
          message: "Please specify at least one question type count" 
        };
      }
      
      if (totalQuestions !== requestedQuestions) {
        return { 
          isValid: false, 
          message: `The sum of question type counts (${totalQuestions}) must equal the total number of questions (${requestedQuestions})` 
        };
      }
    }
    
    return { isValid: true };
  };

  // Update this handler to include question type configuration
  const handleGenerateExam = async (values: FormValues) => {
    setIsGenerating(true);
    setGenerationError(null);
    
    // Validate that at least one topic is selected
    if (values.topics.length === 0) {
      setGenerationError("Please select at least one topic");
      setIsGenerating(false);
      return;
    }
    
    // Validate customized question counts
    const validation = validateCustomizedQuestions(values);
    if (!validation.isValid) {
      setGenerationError(validation.message || "Invalid question configuration");
      setIsGenerating(false);
      return;
    }

    // Add question type configuration
    let questionTypeConfig: Record<string, number> = {};
    let questionTypesArray: string[] = [];
    
    if (values.questionTypes === "mcq") {
      questionTypesArray = ["mcq"];
      questionTypeConfig = { mcq: parseInt(values.numberOfQuestions) };
    } else if (values.questionTypes === "shortAnswer") {
      questionTypesArray = ["shortAnswer"];
      questionTypeConfig = { shortAnswer: parseInt(values.numberOfQuestions) };
    } else if (values.questionTypes === "essay") {
      questionTypesArray = ["essay"];
      questionTypeConfig = { essay: parseInt(values.numberOfQuestions) };
    } else if (values.questionTypes === "trueFalse") {
      questionTypesArray = ["trueFalse"];
      questionTypeConfig = { trueFalse: parseInt(values.numberOfQuestions) };
    } else if (values.questionTypes === "mixed") {
      // For mixed, we'll distribute evenly
      questionTypesArray = ["mcq", "shortAnswer", "essay", "trueFalse"];
      
      const totalQuestions = parseInt(values.numberOfQuestions);
      const baseCount = Math.floor(totalQuestions / 4);
      const remainder = totalQuestions % 4;
      
      questionTypeConfig = {
        mcq: baseCount + (remainder > 0 ? 1 : 0),
        shortAnswer: baseCount + (remainder > 1 ? 1 : 0),
        essay: baseCount + (remainder > 2 ? 1 : 0),
        trueFalse: baseCount
      };
    } else if (values.questionTypes === "customized") {
      // For customized, use the user's input
      questionTypesArray = [];
      
      const mcqCount = parseInt(values.mcqCount || "0");
      if (mcqCount > 0) {
        questionTypesArray.push("mcq");
        questionTypeConfig.mcq = mcqCount;
      }
      
      const shortAnswerCount = parseInt(values.shortAnswerCount || "0");
      if (shortAnswerCount > 0) {
        questionTypesArray.push("shortAnswer");
        questionTypeConfig.shortAnswer = shortAnswerCount;
      }
      
      const essayCount = parseInt(values.essayCount || "0");
      if (essayCount > 0) {
        questionTypesArray.push("essay");
        questionTypeConfig.essay = essayCount;
      }
      
      const trueFalseCount = parseInt(values.trueFalseCount || "0");
      if (trueFalseCount > 0) {
        questionTypesArray.push("trueFalse");
        questionTypeConfig.trueFalse = trueFalseCount;
      }
    }
    
    console.log("Question types array:", questionTypesArray);
    console.log("Question type config:", questionTypeConfig);
    
    // Construct the prompt for the AI
    let prompt = `Generate an exam with the following specifications:
    
    Name: ${values.examName}
    Topics: ${values.topics.join(", ")}
    Number of Questions: ${values.numberOfQuestions}
    Difficulty: ${values.difficulty}
    Question Types: ${questionTypesArray.join(", ")}
    `;

    // Add question type configuration to the prompt
    prompt += "\nQuestion Type Distribution:\n";
    Object.entries(questionTypeConfig).forEach(([type, count]) => {
      const readableType = type === "mcq" ? "Multiple Choice Questions" :
                          type === "shortAnswer" ? "Short Answer Questions" :
                          type === "essay" ? "Essay Questions" :
                          "True/False Questions";
      prompt += `- ${readableType}: ${count}\n`;
    });

    // Add syllabus context if available
    if (syllabus.trim()) {
      prompt += `\nSyllabus Context:\n${syllabus}`;
    }

    // Add instructions for question weights if needed
    if (values.includeQuestionWeights) {
      prompt += `\n\nPlease assign different weights to questions based on their difficulty and complexity. 
      Use a scale of 1-5, where 1 is easiest and 5 is most difficult.`;
    }

    // Add formatting instructions with explicit type labeling
    prompt += `\n\nFormat the exam as follows:
    1. Start with a brief introduction
    2. For each question:
       - Clearly number the question
       - IMPORTANT: Label each question with its type at the beginning (e.g., "MCQ:", "Short Answer:", "Essay:", "True/False:")
       - For multiple choice, provide options labeled A, B, C, D on separate lines
       - For short answer, indicate expected answer length
       - For essay questions, provide clear instructions and word count guidance
       - For true/false questions, clearly state the statement to evaluate
    3. If question weights are included, indicate the weight of each question in parentheses after the question number
    
    Please provide the correct answers at the end of the exam. For MCQs, clearly indicate the letter of the correct answer (e.g., "Answer: B").`;

    try {
      console.log("Calling Gemini AI with params:", {
        task: "generate_questions",
        prompt: prompt,
        questionTypes: questionTypesArray,
      });
      
      const response = await useGeminiAI({
        task: "generate_questions",
        prompt: prompt,
        questionTypes: questionTypesArray,
        difficulty: values.difficulty,
        numberOfQuestions: parseInt(values.numberOfQuestions),
        topics: values.topics,
      });

      if (response.success && response.response) {
        // Process the response
        const examContent = response.response;
        setExamQuestions(examContent);

        // Parse question weights if included
        const weights: Record<number, number> = {};
        if (values.includeQuestionWeights) {
          const weightRegex = /(\d+)\s*\((\d+)\s*points?\)/gi;
          let match;
          while ((match = weightRegex.exec(examContent)) !== null) {
            const questionNumber = parseInt(match[1]) - 1; // 0-indexed
            const weight = parseInt(match[2]);
            weights[questionNumber] = weight;
          }
          setQuestionWeights(weights);
        }

        // Create the exam object
        const newExam: IExam = {
          id: `exam-${Date.now()}`,
          name: values.examName,
          date: format(values.examDate, "yyyy-MM-dd"),
          time: values.examTime,
          duration: values.examDuration,
          numberOfQuestions: values.numberOfQuestions,
          topics: values.topics,
          difficulty: values.difficulty,
          questionTypes: values.questionTypes,
          questions: examContent,
          questionWeights: Object.keys(weights).length > 0 ? weights : undefined,
          questionTypeConfig: questionTypeConfig,
          questionDistribution: questionTypeConfig, // Add question distribution for rendering
          created: new Date().toISOString(),
        };

        setGeneratedExam(newExam);
        onSaveExam(newExam);

        toast({
          title: "Exam Generated",
          description: "Your exam has been successfully generated and saved.",
        });
      } else {
        setGenerationError("Failed to generate exam. Please try again.");
        toast({
          title: "Generation Failed",
          description: "Failed to generate exam. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating exam:", error);
      setGenerationError("An error occurred while generating the exam.");
      toast({
        title: "Error",
        description: "An error occurred while generating the exam.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Add a function to handle question type selection
  const handleQuestionTypeChange = (value: string) => {
    form.setValue("questionTypes", value);
    
    if (value === "mcq") {
      setSelectedQuestionTypes(["mcq"]);
      // Update counts to match the selection
      form.setValue("mcqCount", form.getValues("numberOfQuestions"));
      form.setValue("shortAnswerCount", "0");
      form.setValue("essayCount", "0");
      form.setValue("trueFalseCount", "0");
    } else if (value === "shortAnswer") {
      setSelectedQuestionTypes(["shortAnswer"]);
      form.setValue("mcqCount", "0");
      form.setValue("shortAnswerCount", form.getValues("numberOfQuestions"));
      form.setValue("essayCount", "0");
      form.setValue("trueFalseCount", "0");
    } else if (value === "essay") {
      setSelectedQuestionTypes(["essay"]);
      form.setValue("mcqCount", "0");
      form.setValue("shortAnswerCount", "0");
      form.setValue("essayCount", form.getValues("numberOfQuestions"));
      form.setValue("trueFalseCount", "0");
    } else if (value === "trueFalse") {
      setSelectedQuestionTypes(["trueFalse"]);
      form.setValue("mcqCount", "0");
      form.setValue("shortAnswerCount", "0");
      form.setValue("essayCount", "0");
      form.setValue("trueFalseCount", form.getValues("numberOfQuestions"));
    } else if (value === "mixed") {
      setSelectedQuestionTypes(["mcq", "shortAnswer", "essay", "trueFalse"]);
      // Reset counts for mixed
      form.setValue("mcqCount", "");
      form.setValue("shortAnswerCount", "");
      form.setValue("essayCount", "");
      form.setValue("trueFalseCount", "");
    } else if (value === "customized") {
      // For customized, set all types but let user adjust counts
      setSelectedQuestionTypes(["mcq", "shortAnswer", "essay", "trueFalse"]);
      
      // Set default values for customized distribution if empty
      if (!form.getValues("mcqCount")) form.setValue("mcqCount", "5");
      if (!form.getValues("shortAnswerCount")) form.setValue("shortAnswerCount", "3");
      if (!form.getValues("essayCount")) form.setValue("essayCount", "1");
      if (!form.getValues("trueFalseCount")) form.setValue("trueFalseCount", "1");
      
      // Update total count
      const total = parseInt(form.getValues("mcqCount") || "0") + 
                    parseInt(form.getValues("shortAnswerCount") || "0") + 
                    parseInt(form.getValues("essayCount") || "0") + 
                    parseInt(form.getValues("trueFalseCount") || "0");
      
      form.setValue("numberOfQuestions", total.toString());
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Exam</CardTitle>
        <CardDescription>Create a new exam based on your syllabus</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleGenerateExam)} className="space-y-6">
            {/* Basic Exam Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="examName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exam Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Midterm Exam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="examDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Exam Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="examTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="examDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min="5" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Questions</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="50" 
                          {...field}
                          readOnly={form.watch("questionTypes") === "customized"}
                          className={form.watch("questionTypes") === "customized" ? "bg-gray-100" : ""}
                        />
                      </FormControl>
                      {form.watch("questionTypes") === "customized" && (
                        <p className="text-xs text-muted-foreground">
                          Auto-calculated from question type distribution
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Syllabus and Topics */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Syllabus & Topics</h3>
              
              <SyllabusUploader 
                onSyllabusContent={handleSyllabusUpload}
                onTopicsExtracted={handleTopicsExtracted}
              />
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom topics (comma separated)"
                  value={customTopics}
                  onChange={(e) => setCustomTopics(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddCustomTopics}>
                  Add
                </Button>
              </div>

              <FormField
                control={form.control}
                name="topics"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="flex items-center">
                        <ListOrdered className="mr-2 h-4 w-4" />
                        Select Topics
                      </FormLabel>
                    </div>
                    {availableTopics.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {availableTopics.map((topic, index) => (
                          <FormField
                            key={`${topic}-${index}`}
                            control={form.control}
                            name="topics"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={`${topic}-${index}`}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(topic)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, topic])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== topic
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel 
                                    className="font-normal cursor-pointer"
                                    onClick={() => handleTopicClick(topic)}
                                  >
                                    {topic}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {availableTopics.length === 0 && (
                      <div className="text-muted-foreground text-sm p-4 border border-dashed rounded-md text-center">
                        Upload a syllabus or add custom topics to get started
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Exam Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Exam Configuration</h3>

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Question Types Field - Updated to handle customized configuration */}
              <FormField
                control={form.control}
                name="questionTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Types</FormLabel>
                    <Select
                      onValueChange={(value) => handleQuestionTypeChange(value)}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select question types" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mcq">Multiple Choice Only</SelectItem>
                        <SelectItem value="shortAnswer">Short Answer Only</SelectItem>
                        <SelectItem value="essay">Essay Only</SelectItem>
                        <SelectItem value="trueFalse">True/False Only</SelectItem>
                        <SelectItem value="mixed">Mixed (Auto-distributed)</SelectItem>
                        <SelectItem value="customized">Customized Distribution</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Question Type Configuration - Only show when "customized" is selected */}
              {form.watch("questionTypes") === "customized" && (
                <div className="space-y-4 pl-4 border-l-2 border-muted-foreground/20 mt-4">
                  <div className="text-sm font-medium text-foreground/80 mb-2">
                    Specify the number of questions for each type:
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="mcqCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Multiple Choice Questions</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="shortAnswerCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Answer Questions</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="essayCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Essay Questions</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="trueFalseCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>True/False Questions</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="includeQuestionWeights"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include question weights
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Assign different point values to questions based on difficulty
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isGenerating || generationError !== null}
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Generating Exam...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Exam
                </>
              )}
            </Button>

            {generationError && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {generationError}
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GenerateExamTab;
