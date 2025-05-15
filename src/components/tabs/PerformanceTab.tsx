
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExamAverageScore, getTopicPerformance } from "@/components/PerformanceCharts";
import { IExam } from "@/components/ExamTabs";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  Legend, 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Line, 
  LineChart,
  CartesianGrid
} from "recharts";
import { AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import DeleteExamHandler from "@/components/exam/DeleteExamHandler";
import { useToast } from "@/hooks/use-toast";

// Define IExamResult interface here to avoid circular dependency
export interface IExamResult {
  examId: string;
  examName: string;
  date: string;
  answers: Record<string, string>;
  timeTaken: string;
  questionTypes: Array<string>;
  questionWeights: Record<number, number>;
  percentage: number;
  questions: Array<{
    question: string;
    type: string;
    options?: string[];
    answer?: string;
  }>;
}

interface PerformanceTabProps {
  examsWithResults: { exam: IExam; result: IExamResult }[];
  onDeleteExam?: (examId: string) => void;
}

const PerformanceTab = ({ examsWithResults, onDeleteExam }: PerformanceTabProps) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const { toast } = useToast();

  // Ensure examsWithResults is defined to prevent errors
  const safeExamsWithResults = examsWithResults || [];

  // Color palette for charts - enhanced with more vibrant colors
  const colors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#06b6d4", "#14b8a6", "#8b5cf6", "#f43f5e"];

  // Calculate overall average score
  const overallAverage =
    safeExamsWithResults.length > 0
      ? Math.round(
          safeExamsWithResults.reduce((sum, { result }) => sum + result.percentage, 0) /
            safeExamsWithResults.length
        )
      : 0;

  // Calculate average score by exam
  const examScores = safeExamsWithResults.map(({ exam, result }, index) => ({
    name: exam.name,
    score: result.percentage,
    color: colors[index % colors.length],
    examId: exam.id,
  }));

  // Get topic performance data
  const topicPerformance = getTopicPerformance(safeExamsWithResults);

  // Get average scores over time
  const scoresOverTime = getExamAverageScore(safeExamsWithResults);

  const handleDeleteExam = (examId: string) => {
    if (onDeleteExam) {
      onDeleteExam(examId);
      
      toast({
        title: "Exam Deleted",
        description: "The exam and its associated data have been removed",
      });
    }
  };

  if (safeExamsWithResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Analysis</CardTitle>
          <CardDescription>Track your exam performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No data available</AlertTitle>
            <AlertDescription>
              Complete exams to see your performance analytics here.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Analysis</CardTitle>
        <CardDescription>Track your exam performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="topics">Topics Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Overall Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline">
                    <div className="text-3xl font-bold">{overallAverage}%</div>
                    <div className="ml-2 text-sm text-muted-foreground">
                      {overallAverage >= 80 ? "Excellent!" : 
                       overallAverage >= 70 ? "Good!" : 
                       overallAverage >= 60 ? "Fair" : "Needs improvement"}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {safeExamsWithResults.length} completed exam
                    {safeExamsWithResults.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Recent Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={scoresOverTime}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" opacity={0.4} />
                      <XAxis dataKey="date" stroke="#71717a" />
                      <YAxis domain={[0, 100]} stroke="#71717a" />
                      <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        dot={{ stroke: '#0ea5e9', strokeWidth: 2, fill: '#fff', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Score by Exam</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={examScores} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" opacity={0.4} />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, "Score"]}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="score" 
                      name="Score (%)"
                      label={{ 
                        position: 'top', 
                        formatter: (value: number) => `${value}%`,
                        fontSize: 10,
                        fill: '#666'
                      }}
                    >
                      {examScores.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Exam History</h3>
              <div className="space-y-3">
                {safeExamsWithResults.map(({ exam, result }, index) => (
                  <div 
                    key={exam.id || index}
                    className="flex items-center justify-between bg-card p-3 rounded-md border"
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-2 h-10 rounded-full mr-3"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      ></div>
                      <div>
                        <h4 className="font-medium text-sm">{exam.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(exam.date || result.date).toLocaleDateString()} • Score: {result.percentage}%
                        </p>
                      </div>
                    </div>
                    <div>
                      {onDeleteExam && (
                        <DeleteExamHandler 
                          examId={exam.id || ""} 
                          variant="icon"
                          size="sm"
                          onDelete={() => handleDeleteExam(exam.id || "")}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance by Topic</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={150} data={topicPerformance}>
                    <PolarGrid gridType="polygon" stroke="#d4d4d8" />
                    <PolarAngleAxis dataKey="topic" tick={{ fontSize: 12, fill: '#888' }} />
                    <PolarRadiusAxis domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.6}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, "Score"]}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Topic difficulty matrix */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Topic Proficiency Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {topicPerformance.map((topic, index) => (
                    <div 
                      key={index} 
                      className="p-3 rounded-lg border flex flex-col items-center text-center"
                      style={{ 
                        backgroundColor: topic.score >= 80 ? 'rgba(34, 197, 94, 0.1)' : 
                                       topic.score >= 60 ? 'rgba(245, 158, 11, 0.1)' : 
                                       'rgba(239, 68, 68, 0.1)',
                        borderColor: topic.score >= 80 ? 'rgba(34, 197, 94, 0.3)' : 
                                   topic.score >= 60 ? 'rgba(245, 158, 11, 0.3)' : 
                                   'rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <span className="font-medium text-sm mb-1">{topic.topic}</span>
                      <div className="text-lg font-semibold">
                        {topic.score}%
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {topic.score >= 80 ? 'Strong' : 
                         topic.score >= 60 ? 'Moderate' : 
                         'Needs work'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceTab;
