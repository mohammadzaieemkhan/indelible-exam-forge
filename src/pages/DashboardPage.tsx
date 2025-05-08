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

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<string>("generate");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string>("");
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
  
  // Handle exam generation with Gemini AI
  const handleGenerateExam = async () => {
    setIsGeneratingQuestions(true);
    setGeneratedQuestions("");
    
    try {
      // Get the selected topics from the UI
      const topicElements = document.querySelectorAll('.bg-primary\\/20.text-primary');
      const topics = Array.from(topicElements).map(el => el.textContent?.replace('×', '').trim() || "");
      
      // Get difficulty level
      const difficultyLevels = [];
      if ((document.getElementById('easy') as HTMLInputElement)?.checked) difficultyLevels.push('easy');
      if ((document.getElementById('medium') as HTMLInputElement)?.checked) difficultyLevels.push('medium');
      if ((document.getElementById('hard') as HTMLInputElement)?.checked) difficultyLevels.push('hard');
      const difficulty = difficultyLevels.join(', ');
      
      // Call Gemini API via our edge function
      const result = await useGeminiAI({
        task: "generate_questions",
        topics: topics.length > 0 ? topics : ["General Knowledge"],
        difficulty: difficulty || "medium",
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
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> New Exam
          </Button>
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
                        <div className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2">
                          Algebra
                          <button className="hover:text-destructive">×</button>
                        </div>
                        <div className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2">
                          Calculus
                          <button className="hover:text-destructive">×</button>
                        </div>
                        <input 
                          type="text" 
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
                        defaultValue={60} 
                        className="w-full mt-1" 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>15 mins</span>
                        <span>60 mins</span>
                        <span>180 mins</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Question Type</label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="mcq" name="question_type" defaultChecked />
                          <label htmlFor="mcq">Multiple Choice</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="essay" name="question_type" />
                          <label htmlFor="essay">Essay</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="radio" id="mixed" name="question_type" />
                          <label htmlFor="mixed">Mixed</label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Difficulty</label>
                      <div className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="easy" defaultChecked />
                          <label htmlFor="easy">Easy</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="medium" defaultChecked />
                          <label htmlFor="medium">Medium</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="hard" />
                          <label htmlFor="hard">Hard</label>
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
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-2">Midterm Exam</td>
                      <td className="p-2">May 5, 2025</td>
                      <td className="p-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          Algebra
                        </span>
                      </td>
                      <td className="p-2">Medium</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                    <tr className="border-b hover:bg-muted/20">
                      <td className="p-2">Final Exam</td>
                      <td className="p-2">Apr 20, 2025</td>
                      <td className="p-2">
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          Calculus
                        </span>
                      </td>
                      <td className="p-2">Hard</td>
                      <td className="p-2">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
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
                    {Array(31).fill(null).map((_, i) => (
                      <div 
                        key={`day-${i+1}`}
                        className={`p-1 border rounded-md h-16 ${i+1 === 8 ? 'bg-primary/10 border-primary' : ''}`}
                      >
                        <div className="text-right text-sm">{i+1}</div>
                        {i+1 === 8 && (
                          <div className="text-xs p-1 mt-1 bg-primary/20 text-primary rounded">
                            Midterm Exam
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Details Side - Enhanced with WhatsApp notification */}
                <div className="md:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">Exam Details</h3>
                      <Select defaultValue="midterm">
                        <SelectTrigger className="w-full mt-2">
                          <SelectValue placeholder="Select exam" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Upcoming Exams</SelectLabel>
                            <SelectItem value="midterm">Midterm Exam</SelectItem>
                            <SelectItem value="final">Final Exam</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="border rounded-md p-4 space-y-3">
                      <div>
                        <span className="text-sm text-muted-foreground">Name:</span>
                        <p>Midterm Exam</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Date:</span>
                        <p>May 8, 2025 at 10:00 AM</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Duration:</span>
                        <p>60 minutes</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Topics:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            Algebra
                          </span>
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
