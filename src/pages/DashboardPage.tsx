
import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart, LineChart, Calendar, FileText, 
  BookOpen, Settings, Plus, Filter, Download, Bell 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendWhatsAppNotification, useGeminiAI } from "@/utils/apiService";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string>("");
  const [showNewExamDialog, setShowNewExamDialog] = useState<boolean>(false);
  
  // Form states for exam generation
  const [examDate, setExamDate] = useState<string>("");
  const [examDuration, setExamDuration] = useState<string>("60");
  const [questionType, setQuestionType] = useState<string>("mcq");
  const [topics, setTopics] = useState<string[]>(["Algebra", "Calculus"]);
  const [newTopic, setNewTopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState({
    easy: true,
    medium: true,
    hard: false
  });

  // For upcoming exams section
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  
  const { toast } = useToast();
  
  // Handle WhatsApp notification sending
  const handleSendReminder = async () => {
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
        "Reminder: Your Indelible AI test is scheduled to begin soon. Good luck!"
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
    }
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

  // Handle creating a new exam
  const handleCreateExam = () => {
    const newExam = {
      name: "New Exam",
      date: examDate || "2025-05-15",
      time: "10:00 AM",
      duration: examDuration,
      topics: topics,
      difficulty: Object.entries(difficulty)
        .filter(([_, value]) => value)
        .map(([key, _]) => key)
        .join(", ")
    };
    
    setUpcomingExams([...upcomingExams, newExam]);
    setShowNewExamDialog(false);
    
    toast({
      title: "Success",
      description: "New exam created successfully",
    });
  };
  
  // Handle exam generation with Gemini AI
  const handleGenerateExam = async () => {
    setIsGeneratingQuestions(true);
    setGeneratedQuestions("");
    
    try {
      // Get difficulty level
      const difficultyLevels = [];
      if (difficulty.easy) difficultyLevels.push('easy');
      if (difficulty.medium) difficultyLevels.push('medium'); 
      if (difficulty.hard) difficultyLevels.push('hard');
      const difficultyString = difficultyLevels.join(', ');
      
      // Call Gemini API via our edge function
      const result = await useGeminiAI({
        task: "generate_questions",
        topics: topics.length > 0 ? topics : ["General Knowledge"],
        difficulty: difficultyString || "medium",
      });
      
      if (result.success && result.response) {
        setGeneratedQuestions(result.response);
        toast({
          title: "Success",
          description: "Exam questions generated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to generate questions");
      }
    } catch (error) {
      console.error("Error generating exam:", error);
      toast({
        title: "Error",
        description: "Failed to generate exam questions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your exams and track performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" /> Settings
          </Button>
          <Dialog open={showNewExamDialog} onOpenChange={setShowNewExamDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" /> New Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Exam</DialogTitle>
                <DialogDescription>
                  Set up a new exam with custom date, topics, and difficulty.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exam-name" className="text-right">
                    Name
                  </Label>
                  <Input id="exam-name" defaultValue="New Exam" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exam-date" className="text-right">
                    Date
                  </Label>
                  <Input 
                    id="exam-date" 
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exam-duration" className="text-right">
                    Duration
                  </Label>
                  <Input 
                    id="exam-duration" 
                    type="number" 
                    value={examDuration}
                    onChange={(e) => setExamDuration(e.target.value)}
                    min="15" 
                    max="180"
                    className="col-span-3" 
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Topics</Label>
                  <div className="col-span-3 space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Add topic..." 
                        value={newTopic}
                        onChange={(e) => setNewTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                      />
                      <Button type="button" onClick={handleAddTopic}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {topics.map((topic, index) => (
                        <div key={index} className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2">
                          {topic}
                          <button 
                            type="button"
                            onClick={() => handleRemoveTopic(topic)}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreateExam}>Create Exam</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="generate" className="space-y-6" onValueChange={setActiveTab}>
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
        
        {/* Generate Exam Section */}
        <TabsContent value="generate" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Generate New Exam</CardTitle>
              <CardDescription>Create a customized exam based on your syllabus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1: Syllabus Input */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 1: Syllabus Input</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Topic Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Topics</label>
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
                        <input 
                          type="text" 
                          value={newTopic}
                          onChange={(e) => setNewTopic(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                          className="flex-1 min-w-[100px] outline-none bg-transparent" 
                          placeholder="Add topic..." 
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter topics separated by commas or click enter after each one
                      </p>
                    </div>
                  </div>
                  
                  {/* Right: File Upload */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Upload Syllabus (Optional)</label>
                      <div className="border-2 border-dashed rounded-lg mt-1 flex flex-col items-center justify-center p-6 h-[100px] hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="text-center">
                          <p className="text-sm font-medium">Drag & drop or click to upload</p>
                          <p className="text-xs text-muted-foreground">
                            Supports PDF, DOCX, TXT (Max 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 2: Exam Configuration */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Step 2: Exam Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Exam Date</label>
                      <input 
                        type="date" 
                        value={examDate}
                        onChange={(e) => setExamDate(e.target.value)}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 mt-1" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <input 
                        type="range" 
                        min={15} 
                        max={180} 
                        step={5} 
                        value={examDuration}
                        onChange={(e) => setExamDuration(e.target.value)}
                        className="w-full mt-1" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>15 mins</span>
                        <span>{examDuration} mins</span>
                        <span>180 mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Question Type</label>
                      <RadioGroup 
                        value={questionType} 
                        onValueChange={setQuestionType}
                        className="flex gap-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mcq" id="mcq" />
                          <Label htmlFor="mcq">Multiple Choice</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="essay" id="essay" />
                          <Label htmlFor="essay">Essay</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mixed" id="mixed" />
                          <Label htmlFor="mixed">Mixed</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Difficulty</label>
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
              </div>
              
              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button 
                  size="lg" 
                  className={isGeneratingQuestions ? "" : "animate-pulse"}
                  onClick={handleGenerateExam}
                  disabled={isGeneratingQuestions}
                >
                  {isGeneratingQuestions ? "Generating..." : "Generate Exam"}
                </Button>
              </div>
              
              {/* Display generated questions if available */}
              {generatedQuestions && (
                <div className="mt-6 p-4 border rounded-md bg-muted/30">
                  <h4 className="font-medium mb-2">Generated Exam Questions:</h4>
                  <div className="whitespace-pre-line">{generatedQuestions}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Performance Tracking</CardTitle>
              <CardDescription>Analyze student performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Score History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/40">
                      <div className="text-center text-muted-foreground">
                        <LineChart className="h-10 w-10 mx-auto mb-2" />
                        <p>Line Chart Visualization</p>
                        <p className="text-sm">(Connect to Chart.js)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Topic Mastery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/40">
                      <div className="text-center text-muted-foreground">
                        <BarChart className="h-10 w-10 mx-auto mb-2" />
                        <p>Radial Progress Visualization</p>
                        <p className="text-sm">(Connect to Chart.js)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Previous Exams Tab */}
        <TabsContent value="previous" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Previous Exams</CardTitle>
                <CardDescription>View and export your past exams</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" /> Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Exam Name</th>
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">Topics</th>
                      <th className="p-2 text-left font-medium">Difficulty</th>
                      <th className="p-2 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingExams.length > 0 ? upcomingExams.map((exam, index) => (
                      <tr key={index} className="border-b hover:bg-muted/20">
                        <td className="p-2">{exam.name}</td>
                        <td className="p-2">{exam.date}</td>
                        <td className="p-2">
                          {exam.topics.map((topic, i) => (
                            <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full mr-1">
                              {topic}
                            </span>
                          ))}
                        </td>
                        <td className="p-2">{exam.difficulty}</td>
                        <td className="p-2">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No previous exams found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Upcoming Exams Tab - Enhanced with WhatsApp notifications */}
        <TabsContent value="upcoming" className="space-y-6 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Exams</CardTitle>
              <CardDescription>View and manage scheduled exams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {/* Calendar Side */}
                <div className="md:col-span-5 border rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h3 className="font-medium">May 2025</h3>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day labels */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                      <div key={i} className="text-center text-muted-foreground text-sm p-2">
                        {day}
                      </div>
                    ))}
                    
                    {/* Empty days from previous month */}
                    {Array(4).fill(null).map((_, i) => (
                      <div key={`empty-${i}`} className="p-2 h-16" />
                    ))}
                    
                    {/* Actual days */}
                    {Array(31).fill(null).map((_, i) => {
                      // Check if any exams are scheduled for this day
                      const dayExams = upcomingExams.filter(exam => {
                        const examDate = new Date(exam.date);
                        return examDate.getDate() === i + 1 && 
                               examDate.getMonth() === 4 && // May is month 4 (0-indexed)
                               examDate.getFullYear() === 2025;
                      });
                      
                      const hasExam = dayExams.length > 0;
                      
                      return (
                        <div 
                          key={`day-${i+1}`}
                          className={`p-1 border rounded-md h-16 ${hasExam ? 'bg-primary/10 border-primary' : ''}`}
                        >
                          <div className="text-right text-sm">{i+1}</div>
                          {dayExams.map((exam, examIndex) => (
                            <div 
                              key={examIndex}
                              className="text-xs p-1 mt-1 bg-primary/20 text-primary rounded"
                            >
                              {exam.name}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Details Side - Enhanced with WhatsApp notification */}
                <div className="md:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">Exam Details</h3>
                      {upcomingExams.length > 0 ? (
                        <Select defaultValue="0">
                          <SelectTrigger className="w-full mt-2">
                            <SelectValue placeholder="Select exam" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Upcoming Exams</SelectLabel>
                              {upcomingExams.map((exam, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {exam.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                          No upcoming exams scheduled. Click "New Exam" to create one.
                        </p>
                      )}
                    </div>
                    
                    {upcomingExams.length > 0 && (
                      <div className="border rounded-md p-4 space-y-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <p>{upcomingExams[0].name}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Date:</span>
                          <p>{upcomingExams[0].date} at {upcomingExams[0].time}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Duration:</span>
                          <p>{upcomingExams[0].duration} minutes</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Topics:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {upcomingExams[0].topics.map((topic, i) => (
                              <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 flex space-x-2">
                          <Button size="sm">View Details</Button>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Bell className="h-4 w-4 mr-1" /> Send Reminder
                              </Button>
                            </DialogTrigger>
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
                          
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
