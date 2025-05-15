
import { useState } from "react";
import { Bar, Radar, Line } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExamAverageScore, getTopicPerformance } from "@/components/PerformanceCharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { IExam, IExamResult } from "@/components/ExamTabs";
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Cell, Legend } from "recharts";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PerformanceTabProps {
  examsWithResults: { exam: IExam; result: IExamResult }[];
}

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
                    <ChartContainer
                      title="Recent performance"
                      data={scoresOverTime}
                      showAnimation={true}
                    >
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                      />
                      <ChartTooltip>
                        <ChartTooltipContent />
                      </ChartTooltip>
                    </ChartContainer>
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
                    <Tooltip formatter={(value) => [`${value}%`, "Score"]} />
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
                  <ChartContainer
                    title="Topic Performance"
                    data={topicPerformance}
                    showAnimation={true}
                  >
                    <Radar
                      dataKey="score"
                      stroke="#0ea5e9"
                      fill="#0ea5e9"
                      fillOpacity={0.6}
                    />
                    <ChartTooltip>
                      <ChartTooltipContent />
                    </ChartTooltip>
                  </ChartContainer>
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
