
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import PerformanceCharts from "../PerformanceCharts";
import DeleteExamHandler from "../exam/DeleteExamHandler";

interface ExamResult {
  examId: string;
  examName: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  answers: Record<string, any>;
  timeTaken: string;
  questionTypes: string[];
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    answer: string;
  }>;
  questionTypesBreakdown?: Record<string, {
    correct: number;
    total: number;
    percentage: number;
  }>;
}

const PerformanceTab = () => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load exam results from localStorage
    const loadResults = () => {
      try {
        const resultsJson = localStorage.getItem("examResults");
        if (resultsJson) {
          const parsedResults = JSON.parse(resultsJson);
          
          // Process each result to calculate question type breakdowns
          const processedResults = parsedResults.map(result => {
            if (!result.questionTypesBreakdown) {
              // Add question type breakdown if it doesn't exist
              const breakdown = {};
              const questions = result.questions || [];
              const answers = result.answers || {};
              
              // Group questions by type
              questions.forEach((q, index) => {
                const type = q.type;
                if (!breakdown[type]) {
                  breakdown[type] = { correct: 0, total: 0, percentage: 0 };
                }
                
                breakdown[type].total += 1;
                
                // Check if answer is correct
                const userAnswer = answers[index];
                if (userAnswer !== undefined) {
                  // For MCQ, compare option index
                  if (type === 'mcq') {
                    const correctOption = q.options.findIndex(opt => 
                      opt.toLowerCase() === q.answer.toLowerCase());
                    if (userAnswer === correctOption) {
                      breakdown[type].correct += 1;
                    }
                  } 
                  // For true/false
                  else if (type === 'truefalse') {
                    const isCorrect = 
                      (userAnswer === 0 && q.answer.toLowerCase() === 'true') || 
                      (userAnswer === 1 && q.answer.toLowerCase() === 'false');
                    if (isCorrect) {
                      breakdown[type].correct += 1;
                    }
                  }
                  // For other types we can't automatically check
                }
                
                // Calculate percentage
                breakdown[type].percentage = Math.round(
                  (breakdown[type].correct / breakdown[type].total) * 100
                );
              });
              
              return {
                ...result,
                questionTypesBreakdown: breakdown
              };
            }
            return result;
          });
          
          setExamResults(processedResults);
        }
      } catch (error) {
        console.error("Error loading exam results:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadResults();
    
    // Listen for changes
    window.addEventListener("storage", loadResults);
    return () => window.removeEventListener("storage", loadResults);
  }, []);

  const handleDelete = (examId: string) => {
    // Remove from state
    const updatedResults = examResults.filter(result => result.examId !== examId);
    setExamResults(updatedResults);
    
    // Update localStorage
    localStorage.setItem('examResults', JSON.stringify(updatedResults));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (examResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Performance Data</CardTitle>
          <CardDescription>
            You haven't taken any exams yet. Complete some exams to see your performance metrics.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="text-center text-muted-foreground">
            <p>Your exam performance data will appear here after you've completed exams.</p>
            <p className="mt-2">Take an exam from the "Upcoming Exams" tab to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall stats
  const totalExams = examResults.length;
  const averageScore = examResults.reduce((sum, result) => sum + result.percentage, 0) / totalExams;
  const highestScore = Math.max(...examResults.map(result => result.percentage));
  const lowestScore = Math.min(...examResults.map(result => result.percentage));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Exams</CardDescription>
            <CardTitle className="text-3xl">{totalExams}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Score</CardDescription>
            <CardTitle className="text-3xl">{averageScore.toFixed(1)}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Highest Score</CardDescription>
            <CardTitle className="text-3xl">{highestScore}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lowest Score</CardDescription>
            <CardTitle className="text-3xl">{lowestScore}%</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
          <CardDescription>Visualized exam performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <PerformanceCharts examScores={examResults} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exam History</CardTitle>
          <CardDescription>Detailed results from your previous exams</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All Exams</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="highest">Highest Score</TabsTrigger>
            </TabsList>
            <div className="mt-4">
              <TabsContent value="all">
                <div className="space-y-4">
                  {examResults.map((result) => (
                    <div key={result.examId + result.date} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{result.examName}</h3>
                          <p className="text-muted-foreground text-sm">
                            {new Date(result.date).toLocaleDateString()} • {result.timeTaken}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold ${
                            result.percentage >= 70 ? 'text-green-500' : 
                            result.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {result.percentage}%
                          </div>
                          <DeleteExamHandler 
                            examId={result.examId} 
                            variant="icon" 
                            onDelete={() => handleDelete(result.examId)} 
                          />
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="font-medium">{result.score} / {result.maxScore} points</p>
                        </div>
                        
                        {result.questionTypesBreakdown && (
                          <div className="col-span-2">
                            <p className="text-sm text-muted-foreground">Question Type Breakdown</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.entries(result.questionTypesBreakdown).map(([type, data]) => (
                                <div key={type} className="text-xs bg-muted rounded-full px-2 py-1">
                                  {type === 'mcq' ? 'Multiple Choice' : 
                                   type === 'truefalse' ? 'True/False' : 
                                   type === 'shortanswer' ? 'Short Answer' : 
                                   type === 'essay' ? 'Essay' : type}
                                  : {data.correct}/{data.total} ({data.percentage}%)
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="recent">
                <div className="space-y-4">
                  {[...examResults]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map((result) => (
                      <div key={result.examId + result.date} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold">{result.examName}</h3>
                            <p className="text-muted-foreground text-sm">
                              {new Date(result.date).toLocaleDateString()} • {result.timeTaken}
                            </p>
                          </div>
                          <div className={`text-lg font-bold ${
                            result.percentage >= 70 ? 'text-green-500' : 
                            result.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {result.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="highest">
                <div className="space-y-4">
                  {[...examResults]
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 5)
                    .map((result) => (
                      <div key={result.examId + result.date} className="border rounded-lg p-4">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-semibold">{result.examName}</h3>
                            <p className="text-muted-foreground text-sm">
                              {new Date(result.date).toLocaleDateString()} • {result.timeTaken}
                            </p>
                          </div>
                          <div className={`text-lg font-bold ${
                            result.percentage >= 70 ? 'text-green-500' : 
                            result.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {result.percentage}%
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTab;
