
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartContainer } from "@/components/ui/chart";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveContainer, BarChart, LineChart, XAxis, YAxis, Tooltip, Line, Bar, Cell, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

interface IExam {
  id?: string;
  name: string;
  date: string;
  time: string;
  duration: string;
  numberOfQuestions: string;
  topics: string[];
  difficulty: string;
  questionTypes: string;
}

interface IExamResult {
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
}

interface PerformanceTabProps {
  examsWithResults: { exam: IExam; result: IExamResult }[];
}

// Helper functions to get data for charts
const getExamAverageScore = (examsWithResults: { exam: IExam; result: IExamResult }[]) => {
  return examsWithResults.map(({ exam, result }) => ({
    name: exam.name,
    date: new Date(result.date).toLocaleDateString(),
    score: result.percentage,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const getTopicPerformance = (examsWithResults: { exam: IExam; result: IExamResult }[]) => {
  const topicScores: Record<string, { total: number; count: number }> = {};
  
  // Collect all topic scores
  examsWithResults.forEach(({ result }) => {
    if (result.topicPerformance) {
      Object.entries(result.topicPerformance).forEach(([topic, score]) => {
        if (!topicScores[topic]) {
          topicScores[topic] = { total: 0, count: 0 };
        }
        topicScores[topic].total += score;
        topicScores[topic].count += 1;
      });
    }
  });
  
  // Calculate averages and format for radar chart
  return Object.entries(topicScores).map(([topic, { total, count }]) => ({
    subject: topic,
    score: Math.round(total / count),
    fullMark: 100,
  }));
};

const PerformanceTab = ({ examsWithResults }: PerformanceTabProps) => {
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Color palette for charts
  const colors = ["#0ea5e9", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#ec4899"];

  // Calculate overall average score
  const overallAverage =
    examsWithResults.length > 0
      ? Math.round(
          examsWithResults.reduce((sum, { result }) => sum + result.percentage, 0) /
            examsWithResults.length
        )
      : 0;

  // Calculate average score by exam
  const examScores = examsWithResults.map(({ exam, result }) => ({
    name: exam.name,
    score: result.percentage,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  // Get topic performance data
  const topicPerformance = getTopicPerformance(examsWithResults);

  // Get average scores over time
  const scoresOverTime = getExamAverageScore(examsWithResults);

  if (examsWithResults.length === 0) {
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
                  <div className="text-3xl font-bold">{overallAverage}%</div>
                  <p className="text-xs text-muted-foreground">
                    Based on {examsWithResults.length} completed exam
                    {examsWithResults.length !== 1 ? "s" : ""}
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
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="date" stroke="#71717a" />
                      <YAxis stroke="#71717a" domain={[0, 100]} />
                      <Tooltip 
                        formatter={(value: any) => [`${value}%`, 'Score']}
                        contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
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
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: any) => [`${value}%`, "Score"]} />
                    <Legend />
                    <Bar dataKey="score" name="Score (%)">
                      {examScores.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topics" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Performance by Topic</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart 
                    cx="50%" 
                    cy="50%" 
                    outerRadius="80%" 
                    data={topicPerformance}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.6}
                    />
                    <Tooltip formatter={(value: any) => [`${value}%`, "Score"]} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PerformanceTab;
