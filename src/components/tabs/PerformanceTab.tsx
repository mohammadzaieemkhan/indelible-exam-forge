
import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, PieChart, LineChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, Line } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { IExam } from "@/components/ExamTabs";

interface PerformanceTabProps {
  completedExams: any[];
}

const PerformanceTab = ({ completedExams }: PerformanceTabProps) => {
  // Format the data for charts
  const scoreData = useMemo(() => {
    return completedExams.map(exam => ({
      name: exam.name,
      score: typeof exam.percentage === 'number' ? exam.percentage : 0,
      date: exam.completedAt ? new Date(exam.completedAt).toLocaleDateString() : 'Unknown'
    }));
  }, [completedExams]);

  // Topic performance data
  const topicPerformanceData = useMemo(() => {
    const topicScores: Record<string, { total: number; count: number }> = {};
    
    completedExams.forEach(exam => {
      if (exam.topicPerformance) {
        Object.entries(exam.topicPerformance).forEach(([topic, score]) => {
          if (!topicScores[topic]) {
            topicScores[topic] = { total: 0, count: 0 };
          }
          topicScores[topic].total += Number(score);
          topicScores[topic].count += 1;
        });
      } else if (exam.topics) {
        // If we don't have topic performance data, use the overall score for each topic
        exam.topics.forEach((topic: string) => {
          if (!topicScores[topic]) {
            topicScores[topic] = { total: 0, count: 0 };
          }
          topicScores[topic].total += typeof exam.percentage === 'number' ? exam.percentage : 0;
          topicScores[topic].count += 1;
        });
      }
    });
    
    return Object.entries(topicScores)
      .map(([topic, data]) => ({
        name: topic,
        score: Math.round(data.total / data.count),
        fullMark: 100,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [completedExams]);

  // Question type performance data
  const questionTypeData = useMemo(() => {
    const typesCount: Record<string, { correct: number, incorrect: number, unattempted: number }> = {
      'mcq': { correct: 0, incorrect: 0, unattempted: 0 },
      'shortanswer': { correct: 0, incorrect: 0, unattempted: 0 },
      'truefalse': { correct: 0, incorrect: 0, unattempted: 0 },
      'essay': { correct: 0, incorrect: 0, unattempted: 0 }
    };
    
    completedExams.forEach(exam => {
      if (exam.answers && Array.isArray(exam.answers)) {
        exam.answers.forEach((answer: any) => {
          const type = answer.questionType || 'mcq';
          if (!answer.answer) {
            typesCount[type].unattempted += 1;
          } else if (
            answer.correctAnswer && 
            answer.answer.toLowerCase() === answer.correctAnswer.toLowerCase()
          ) {
            typesCount[type].correct += 1;
          } else {
            typesCount[type].incorrect += 1;
          }
        });
      }
    });
    
    return Object.entries(typesCount).map(([type, data]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      correct: data.correct,
      incorrect: data.incorrect,
      unattempted: data.unattempted
    }));
  }, [completedExams]);

  // Time performance by difficulty
  const timePerformanceData = useMemo(() => {
    const difficultyTimes: Record<string, { totalMinutes: number; count: number }> = {
      'easy': { totalMinutes: 0, count: 0 },
      'medium': { totalMinutes: 0, count: 0 },
      'hard': { totalMinutes: 0, count: 0 }
    };
    
    completedExams.forEach(exam => {
      if (exam.difficulty && exam.timeTaken) {
        const difficulty = exam.difficulty.toLowerCase();
        if (difficultyTimes[difficulty]) {
          // Convert "20m 15s" to minutes
          const match = exam.timeTaken.match(/(\d+)m\s*(\d+)s/);
          if (match) {
            const minutes = parseInt(match[1]) + parseInt(match[2]) / 60;
            difficultyTimes[difficulty].totalMinutes += minutes;
            difficultyTimes[difficulty].count += 1;
          }
        }
      }
    });
    
    return Object.entries(difficultyTimes)
      .filter(([_, data]) => data.count > 0)
      .map(([difficulty, data]) => ({
        name: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
        avgTimeMinutes: Math.round((data.totalMinutes / data.count) * 10) / 10
      }));
  }, [completedExams]);

  // Overall performance over time
  const performanceTrendData = useMemo(() => {
    return completedExams
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || 0);
        const dateB = new Date(b.completedAt || 0);
        return dateA.getTime() - dateB.getTime();
      })
      .map((exam, index) => ({
        name: `Exam ${index + 1}`,
        score: typeof exam.percentage === 'number' ? exam.percentage : 0,
        date: exam.completedAt ? new Date(exam.completedAt).toLocaleDateString() : 'Unknown'
      }));
  }, [completedExams]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const isEmpty = completedExams.length === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Your exam performance statistics and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEmpty ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No exam data available yet. Complete some exams to see your performance statistics.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam Scores Chart */}
              <Card className="p-4 shadow-sm">
                <h3 className="font-medium mb-4">Exam Scores</h3>
                <div className="h-[300px]">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={scoreData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          domain={[0, 100]}
                          label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Bar dataKey="score" fill="#8884d8" name="Score (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>

              {/* Topic Performance Chart */}
              <Card className="p-4 shadow-sm">
                <h3 className="font-medium mb-4">Performance by Topic</h3>
                <div className="h-[300px]">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topicPerformanceData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]}
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={120}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Bar dataKey="score" fill="#82ca9d" name="Avg. Score (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>

              {/* Question Type Performance Chart */}
              <Card className="p-4 shadow-sm">
                <h3 className="font-medium mb-4">Question Type Performance</h3>
                <div className="h-[300px]">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={questionTypeData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="correct" stackId="a" fill="#82ca9d" name="Correct" />
                        <Bar dataKey="incorrect" stackId="a" fill="#ff8042" name="Incorrect" />
                        <Bar dataKey="unattempted" stackId="a" fill="#8884d8" name="Unattempted" />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>

              {/* Performance Trend Chart */}
              <Card className="p-4 shadow-sm">
                <h3 className="font-medium mb-4">Performance Trend</h3>
                <div className="h-[300px]">
                  <ChartContainer config={{}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={performanceTrendData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          name="Score (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceTab;
