import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { IExam } from "@/components/ExamTabs";
import { IExamResult } from "@/components/tabs/PerformanceTab";

interface ExamScore {
  examId: string;
  examName: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  questionTypesBreakdown?: Record<string, {
    correct: number;
    total: number;
    percentage: number;
  }>;
}

// Helper functions for PerformanceTab
export const getExamAverageScore = (examsWithResults: { exam: IExam; result: IExamResult }[]) => {
  if (!examsWithResults || examsWithResults.length === 0) {
    return [];
  }
  
  return examsWithResults
    .map(({ exam, result }, index) => ({
      name: exam.name,
      date: new Date(exam.created_at || exam.date || Date.now()).toLocaleDateString(),
      score: result.percentage,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const getTopicPerformance = (examsWithResults: { exam: IExam; result: IExamResult }[]) => {
  if (!examsWithResults || examsWithResults.length === 0) {
    return [];
  }
  
  // Extract topics from exams
  const topicsMap = new Map();
  
  examsWithResults.forEach(({ exam, result }) => {
    const topics = exam.topics || [];
    topics.forEach(topic => {
      if (!topicsMap.has(topic)) {
        topicsMap.set(topic, { totalScore: 0, count: 0 });
      }
      
      const topicData = topicsMap.get(topic);
      topicData.totalScore += result.percentage;
      topicData.count += 1;
    });
  });
  
  // Calculate average score for each topic
  return Array.from(topicsMap.entries()).map(([topic, data]) => ({
    topic,
    score: Math.round(data.totalScore / data.count),
  }));
};

interface PerformanceChartsProps {
  examScores: ExamScore[];
}

const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ examScores }) => {
  if (!examScores || examScores.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <p>No exam data available to generate performance charts.</p>
      </div>
    );
  }
  
  // Format data for time series chart
  const timeSeriesData = examScores.map((score) => ({
    name: score.examName,
    date: new Date(score.date).toLocaleDateString(),
    percentage: score.percentage,
    score: score.score,
    maxScore: score.maxScore,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculate question type performance across all exams
  const questionTypeData = [];
  const questionTypes = new Set<string>();

  // First, collect all question types
  examScores.forEach(score => {
    if (score.questionTypesBreakdown) {
      Object.keys(score.questionTypesBreakdown).forEach(type => questionTypes.add(type));
    }
  });

  // Then build data for each type
  questionTypes.forEach(type => {
    let totalCorrect = 0;
    let totalQuestions = 0;

    examScores.forEach(score => {
      if (score.questionTypesBreakdown && score.questionTypesBreakdown[type]) {
        totalCorrect += score.questionTypesBreakdown[type].correct;
        totalQuestions += score.questionTypesBreakdown[type].total;
      }
    });

    const percentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    questionTypeData.push({
      type: type === 'mcq' ? 'Multiple Choice' : 
            type === 'truefalse' ? 'True/False' : 
            type === 'shortanswer' ? 'Short Answer' : 
            type === 'essay' ? 'Essay' : type,
      percentage: Math.round(percentage),
      correct: totalCorrect,
      total: totalQuestions
    });
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className="space-y-10">
      <div>
        <h3 className="text-lg font-semibold mb-3">Performance Over Time</h3>
        <div className="h-[300px] md:h-[400px] w-full bg-card rounded-lg p-4 border">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
              <XAxis dataKey="date" stroke="#71717a" />
              <YAxis stroke="#71717a" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5' }}
                itemStyle={{ color: '#f4f4f5' }}
                formatter={(value) => [`${value}%`, 'Score']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="percentage"
                name="Score (%)"
                stroke="#6366f1"
                activeDot={{ r: 8 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Performance by Question Type</h3>
          <div className="h-[300px] bg-card rounded-lg p-4 border">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={questionTypeData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                <XAxis dataKey="type" stroke="#71717a" />
                <YAxis stroke="#71717a" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5' }}
                  itemStyle={{ color: '#f4f4f5' }}
                  formatter={(value) => [`${value}%`, 'Success Rate']}
                />
                <Legend />
                <Bar dataKey="percentage" name="Success Rate %" fill="#4f46e5">
                  {questionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Score Distribution</h3>
          <div className="h-[300px] bg-card rounded-lg p-4 border">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'A (90-100%)', value: examScores.filter(s => s.percentage >= 90).length },
                    { name: 'B (80-89%)', value: examScores.filter(s => s.percentage >= 80 && s.percentage < 90).length },
                    { name: 'C (70-79%)', value: examScores.filter(s => s.percentage >= 70 && s.percentage < 80).length },
                    { name: 'D (60-69%)', value: examScores.filter(s => s.percentage >= 60 && s.percentage < 70).length },
                    { name: 'F (<60%)', value: examScores.filter(s => s.percentage < 60).length },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => entry.name}
                  labelLine={true}
                >
                  {[
                    { name: 'A (90-100%)', value: 0, color: '#22c55e' },
                    { name: 'B (80-89%)', value: 0, color: '#10b981' },
                    { name: 'C (70-79%)', value: 0, color: '#f59e0b' },
                    { name: 'D (60-69%)', value: 0, color: '#f97316' },
                    { name: 'F (<60%)', value: 0, color: '#ef4444' },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5' }}
                  itemStyle={{ color: '#f4f4f5' }}
                  formatter={(value) => [`${value} exam(s)`, '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Exam Scores Comparison</h3>
        <div className="h-[300px] md:h-[400px] w-full bg-card rounded-lg p-4 border">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={timeSeriesData}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip
                contentStyle={{ backgroundColor: '#27272a', borderColor: '#3f3f46', color: '#f4f4f5' }}
                itemStyle={{ color: '#f4f4f5' }}
              />
              <Legend />
              <Bar dataKey="score" name="Your Score" fill="#4f46e5" />
              <Bar dataKey="maxScore" name="Max Possible" fill="#94a3b8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;
