
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, PieChart, Trophy, Timer, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGeminiAI } from "@/utils/apiService";
import type { IExam } from "@/components/ExamTabs";
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";
import { ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart";

interface ExamResult {
  examId: string;
  examName: string;
  date: string;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: string;
  questionStats: {
    correct: number;
    incorrect: number;
    unattempted: number;
    total: number;
  };
  topicPerformance: Record<string, number>;
  questionDetails: Array<{
    question: string;
    type: string;
    marksObtained: number;
    totalMarks: number;
    userAnswer?: string;
    correctAnswer?: string;
    feedback?: string;
  }>;
}

const PerformanceTab = () => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load exam results from localStorage
    const savedResults = localStorage.getItem('examResults');
    if (savedResults) {
      try {
        const results = JSON.parse(savedResults);
        setExamResults(results);
        
        if (results.length > 0 && !selectedExam) {
          setSelectedExam(results[0].examId);
        }
      } catch (error) {
        console.error('Error parsing saved exam results:', error);
      }
    }
  }, [selectedExam]);

  const currentResult = selectedExam 
    ? examResults.find(result => result.examId === selectedExam)
    : null;

  // Prepare data for line chart (score history)
  const scoreHistoryData = examResults.map(result => ({
    name: result.examName,
    score: result.percentage,
    date: new Date(result.date).toLocaleDateString()
  }));

  // Prepare data for pie chart (topic mastery)
  const topicMasteryData = currentResult?.topicPerformance 
    ? Object.keys(currentResult.topicPerformance).map(topic => ({
        name: topic,
        value: currentResult.topicPerformance[topic]
      }))
    : [];

  // Colors for the pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#5DADE2', '#58D68D'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Tracking</CardTitle>
        <CardDescription>Analyze your exam performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {examResults.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Exam Results Yet</h3>
            <p className="text-muted-foreground">
              Take an exam to see your performance metrics here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Tabs defaultValue="overview" className="flex-1">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="questions">Question Details</TabsTrigger>
                  <TabsTrigger value="topics">Topic Performance</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-6">
                  {/* Exam selection */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex flex-wrap gap-2">
                      {examResults.map(result => (
                        <button
                          key={result.examId}
                          onClick={() => setSelectedExam(result.examId)}
                          className={`px-3 py-1.5 text-sm font-medium rounded-full 
                            ${selectedExam === result.examId 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'}`}
                        >
                          {result.examName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentResult && (
                    <>
                      {/* Score Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Score</p>
                              <h3 className="text-2xl font-bold mt-1">
                                {currentResult.score}/{currentResult.totalMarks}
                              </h3>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Trophy className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <Progress 
                            value={currentResult.percentage} 
                            className="mt-3 h-2" 
                          />
                          <p className="text-xs text-right mt-1 text-muted-foreground">
                            {currentResult.percentage}%
                          </p>
                        </Card>

                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Time Taken</p>
                              <h3 className="text-2xl font-bold mt-1">{currentResult.timeTaken}</h3>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Timer className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                        </Card>

                        <Card className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Questions</p>
                              <h3 className="text-2xl font-bold mt-1">
                                {currentResult.questionStats.correct}/{currentResult.questionStats.total}
                              </h3>
                            </div>
                            <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                              <Target className="h-6 w-6 text-primary" />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              {currentResult.questionStats.correct} Correct
                            </span>
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              {currentResult.questionStats.incorrect} Incorrect
                            </span>
                            {currentResult.questionStats.unattempted > 0 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                                {currentResult.questionStats.unattempted} Unattempted
                              </span>
                            )}
                          </div>
                        </Card>
                      </div>

                      {/* Charts */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Score History</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              {scoreHistoryData.length > 0 ? (
                                <ChartContainer
                                  config={{
                                    score: { color: "#2563eb" }
                                  }}
                                >
                                  <RechartsLineChart data={scoreHistoryData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Line 
                                      type="monotone" 
                                      dataKey="score" 
                                      name="Score (%)" 
                                      stroke="#2563eb" 
                                      strokeWidth={2} 
                                      dot={{ r: 4 }}
                                      activeDot={{ r: 6 }}
                                    />
                                  </RechartsLineChart>
                                </ChartContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <p className="text-muted-foreground">
                                    Not enough data to display chart
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Topic Mastery</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              {topicMasteryData.length > 0 ? (
                                <ChartContainer
                                  config={
                                    topicMasteryData.reduce((acc, entry, index) => {
                                      acc[entry.name] = { 
                                        color: COLORS[index % COLORS.length],
                                        label: entry.name
                                      };
                                      return acc;
                                    }, {} as Record<string, {color: string, label: string}>)
                                  }
                                >
                                  <RechartsPieChart>
                                    <Pie
                                      data={topicMasteryData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                      nameKey="name"
                                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    >
                                      {topicMasteryData.map((entry, index) => (
                                        <Cell 
                                          key={`cell-${index}`} 
                                          fill={COLORS[index % COLORS.length]} 
                                        />
                                      ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltipContent nameKey="name" />} />
                                    <Legend />
                                  </RechartsPieChart>
                                </ChartContainer>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <p className="text-muted-foreground">
                                    No topic data available
                                  </p>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                  {currentResult && (
                    <div className="rounded-md border overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="p-2 text-left font-medium">Question</th>
                            <th className="p-2 text-left font-medium">Type</th>
                            <th className="p-2 text-left font-medium">Marks</th>
                            <th className="p-2 text-left font-medium">Your Answer</th>
                            <th className="p-2 text-left font-medium">Correct Answer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentResult.questionDetails.map((q, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/20">
                              <td className="p-2">{q.question.length > 40 ? q.question.substring(0, 40) + '...' : q.question}</td>
                              <td className="p-2 capitalize">{q.type}</td>
                              <td className="p-2">{q.marksObtained}/{q.totalMarks}</td>
                              <td className="p-2">{q.userAnswer || 'Not attempted'}</td>
                              <td className="p-2">{q.correctAnswer || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="topics" className="space-y-6">
                  {currentResult && currentResult.topicPerformance && (
                    <div className="space-y-4">
                      {Object.entries(currentResult.topicPerformance).map(([topic, percentage]) => (
                        <div key={topic} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{topic}</span>
                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceTab;
