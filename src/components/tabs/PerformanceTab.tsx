import React, { useState, useMemo } from 'react';
import { IExam } from '@/components/ExamTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CircleCheck, CircleX, HelpCircle, Calendar, BookOpen, Clock, BarChart3 } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Define the props interface for PerformanceTab
interface PerformanceTabProps {
  exams: IExam[]; // Accept exams as prop
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ exams }) => {
  const [timeRange, setTimeRange] = useState<string>("all-time");
  const [selectedSubject, setSelectedSubject] = useState<string>("all-subjects");
  
  // Extract unique subjects from all exams
  const subjects = useMemo(() => {
    const subjectSet = new Set<string>();
    exams.forEach(exam => {
      exam.topics.forEach(topic => subjectSet.add(topic));
    });
    return Array.from(subjectSet);
  }, [exams]);
  
  // Get exam results from localStorage
  const examResults = useMemo(() => {
    try {
      const savedResults = localStorage.getItem('examResults');
      if (savedResults) {
        return JSON.parse(savedResults);
      }
    } catch (error) {
      console.error("Error loading exam results:", error);
    }
    return [];
  }, []);
  
  // Filter results based on selected time range and subject
  const filteredResults = useMemo(() => {
    if (!examResults || examResults.length === 0) return [];
    
    return examResults.filter((result: any) => {
      // Filter by time range
      if (timeRange !== "all-time") {
        const resultDate = new Date(result.date);
        const now = new Date();
        
        if (timeRange === "last-week") {
          const lastWeek = new Date(now.setDate(now.getDate() - 7));
          if (resultDate < lastWeek) return false;
        } else if (timeRange === "last-month") {
          const lastMonth = new Date(now.setMonth(now.getMonth() - 1));
          if (resultDate < lastMonth) return false;
        } else if (timeRange === "last-3-months") {
          const last3Months = new Date(now.setMonth(now.getMonth() - 3));
          if (resultDate < last3Months) return false;
        }
      }
      
      // Filter by subject
      if (selectedSubject !== "all-subjects") {
        // Check if the exam has the selected subject/topic
        const exam = exams.find(e => e.id === result.examId);
        if (!exam || !exam.topics.includes(selectedSubject)) return false;
      }
      
      return true;
    });
  }, [examResults, timeRange, selectedSubject, exams]);
  
  // Calculate average score
  const averageScore = useMemo(() => {
    if (filteredResults.length === 0) return 0;
    const sum = filteredResults.reduce((acc: number, result: any) => acc + result.percentage, 0);
    return Math.round(sum / filteredResults.length);
  }, [filteredResults]);
  
  // Calculate topic performance
  const topicPerformance = useMemo(() => {
    if (filteredResults.length === 0) return [];
    
    const topicScores: Record<string, { total: number, count: number }> = {};
    
    filteredResults.forEach((result: any) => {
      if (result.topicPerformance) {
        Object.entries(result.topicPerformance).forEach(([topic, score]) => {
          if (!topicScores[topic]) {
            topicScores[topic] = { total: 0, count: 0 };
          }
          topicScores[topic].total += Number(score);
          topicScores[topic].count += 1;
        });
      }
    });
    
    return Object.entries(topicScores).map(([topic, { total, count }]) => ({
      name: topic,
      score: Math.round(total / count)
    })).sort((a, b) => b.score - a.score);
  }, [filteredResults]);
  
  // Prepare data for charts
  const pieData = useMemo(() => {
    if (filteredResults.length === 0) return [];
    
    // Count exams by difficulty
    const difficultyCount: Record<string, number> = {
      'Easy': 0,
      'Medium': 0,
      'Hard': 0
    };
    
    filteredResults.forEach((result: any) => {
      const exam = exams.find(e => e.id === result.examId);
      if (exam) {
        const difficulty = exam.difficulty || 'Medium';
        difficultyCount[difficulty] = (difficultyCount[difficulty] || 0) + 1;
      }
    });
    
    return Object.entries(difficultyCount)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [filteredResults, exams]);
  
  // Prepare time series data for line chart
  const timeSeriesData = useMemo(() => {
    if (filteredResults.length === 0) return [];
    
    // Sort results by date
    const sortedResults = [...filteredResults].sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    return sortedResults.map((result: any) => ({
      date: new Date(result.date).toLocaleDateString(),
      score: result.percentage
    }));
  }, [filteredResults]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  
  // Check if we have any data to display
  const hasData = filteredResults.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Performance Analytics</CardTitle>
            <CardDescription>Track your exam performance over time</CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-time">All Time</SelectItem>
                <SelectItem value="last-week">Last Week</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-subjects">All Subjects</SelectItem>
                {subjects.map(subject => (
                  <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                    <p className="text-2xl font-bold">{averageScore}%</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Exams Taken</p>
                    <p className="text-2xl font-bold">{filteredResults.length}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Time Spent</p>
                    <p className="text-2xl font-bold">
                      {filteredResults.length > 0 
                        ? Math.round(filteredResults.reduce((acc: number, result: any) => {
                            const timeParts = result.timeTaken ? result.timeTaken.split(':') : ['0', '0'];
                            return acc + (parseInt(timeParts[0]) * 60 + parseInt(timeParts[1] || 0));
                          }, 0) / filteredResults.length)
                        : 0} min
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Exam</p>
                    <p className="text-2xl font-bold">
                      {filteredResults.length > 0 
                        ? new Date(Math.max(...filteredResults.map((r: any) => new Date(r.date).getTime())))
                            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="topics">Topic Performance</TabsTrigger>
                <TabsTrigger value="progress">Progress Over Time</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Exam Difficulty Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Question Type Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'MCQ', score: 85 },
                            { name: 'True/False', score: 92 },
                            { name: 'Short Answer', score: 78 },
                            { name: 'Essay', score: 65 }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                          <Bar dataKey="score" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Exam Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Exam Name</th>
                            <th className="text-left p-2">Date</th>
                            <th className="text-left p-2">Score</th>
                            <th className="text-left p-2">Time Taken</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredResults.slice(0, 5).map((result: any, index: number) => {
                            const exam = exams.find(e => e.id === result.examId);
                            return (
                              <tr key={index} className="border-b">
                                <td className="p-2">{result.examName || (exam?.name || 'Unknown Exam')}</td>
                                <td className="p-2">{new Date(result.date).toLocaleDateString()}</td>
                                <td className="p-2">{result.percentage}% ({result.score}/{result.totalMarks})</td>
                                <td className="p-2">{result.timeTaken || 'N/A'}</td>
                                <td className="p-2">
                                  <div className="flex items-center">
                                    {result.percentage >= 70 ? (
                                      <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
                                    ) : result.percentage >= 40 ? (
                                      <HelpCircle className="h-4 w-4 text-amber-500 mr-1" />
                                    ) : (
                                      <CircleX className="h-4 w-4 text-red-500 mr-1" />
                                    )}
                                    {result.percentage >= 70 ? 'Passed' : result.percentage >= 40 ? 'Needs Improvement' : 'Failed'}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="topics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Topic Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topicPerformance}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={80} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Bar dataKey="score" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Strengths & Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <CircleCheck className="h-4 w-4 text-green-500 mr-2" /> Strengths
                        </h3>
                        <ul className="space-y-2">
                          {topicPerformance.filter(topic => topic.score >= 70).slice(0, 3).map((topic, i) => (
                            <li key={i} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded">
                              <span>{topic.name}</span>
                              <span className="font-medium">{topic.score}%</span>
                            </li>
                          ))}
                          {topicPerformance.filter(topic => topic.score >= 70).length === 0 && (
                            <li className="text-muted-foreground text-sm">No strengths identified yet</li>
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2 flex items-center">
                          <CircleX className="h-4 w-4 text-red-500 mr-2" /> Areas for Improvement
                        </h3>
                        <ul className="space-y-2">
                          {topicPerformance.filter(topic => topic.score < 70).slice(-3).map((topic, i) => (
                            <li key={i} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                              <span>{topic.name}</span>
                              <span className="font-medium">{topic.score}%</span>
                            </li>
                          ))}
                          {topicPerformance.filter(topic => topic.score < 70).length === 0 && (
                            <li className="text-muted-foreground text-sm">No areas for improvement identified</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Score Progress Over Time</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={timeSeriesData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          angle={-45} 
                          textAnchor="end"
                          height={70}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#8884d8" 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {timeSeriesData.length >= 2 && (
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <h3 className="font-medium mb-2">Trend Analysis</h3>
                          <p>
                            {(() => {
                              const firstScore = timeSeriesData[0].score;
                              const lastScore = timeSeriesData[timeSeriesData.length - 1].score;
                              const difference = lastScore - firstScore;
                              
                              if (difference > 10) {
                                return "Your scores show significant improvement over time. Keep up the good work!";
                              } else if (difference > 0) {
                                return "Your scores are gradually improving. Continue with your current study approach.";
                              } else if (difference === 0) {
                                return "Your performance has been consistent. Consider trying new study techniques to improve further.";
                              } else if (difference > -10) {
                                return "There's a slight decline in your recent scores. Review your study habits and focus on weak areas.";
                              } else {
                                return "Your scores show a significant decline. Consider seeking additional help or changing your study approach.";
                              }
                            })()}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-medium mb-2">Recommendations</h3>
                        <ul className="space-y-2 list-disc pl-5">
                          {topicPerformance.filter(topic => topic.score < 60).slice(0, 2).map((topic, i) => (
                            <li key={i}>
                              Focus on improving your understanding of <span className="font-medium">{topic.name}</span>
                            </li>
                          ))}
                          {filteredResults.length < 5 && (
                            <li>Take more practice exams to get a more accurate assessment of your performance</li>
                          )}
                          {averageScore < 70 && (
                            <li>Consider increasing your study time for better results</li>
                          )}
                          <li>Review your mistakes from previous exams to avoid repeating them</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Performance Data Available</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Complete some exams to see your performance analytics and track your progress over time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceTab;
