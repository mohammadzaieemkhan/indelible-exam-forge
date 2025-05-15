
import React from "react";
import { Bell, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { IExam } from "@/components/ExamTabs";

interface ExamCardProps {
  exam: IExam;
  onSendReminder: (exam: IExam) => void;
  onDeleteClick: (exam: IExam) => void;
  onViewExam: (exam: IExam) => void;
}

const ExamCard = ({ exam, onSendReminder, onDeleteClick, onViewExam }: ExamCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{exam.name}</CardTitle>
            <CardDescription>
              {exam.date} at {exam.time} • 
              {exam.duration} minutes • 
              {exam.numberOfQuestions} questions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {exam.isActive ? (
              <Button variant="outline" onClick={() => onViewExam(exam)} className="whitespace-nowrap">
                <FileText className="h-4 w-4 mr-2" />
                Take Exam
              </Button>
            ) : (
              <Button variant="outline" disabled className="whitespace-nowrap">
                <FileText className="h-4 w-4 mr-2" />
                Not Available Yet
              </Button>
            )}
            <Button variant="outline" onClick={() => onSendReminder(exam)} className="whitespace-nowrap">
              <Bell className="h-4 w-4 mr-2" />
              Remind Me
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onDeleteClick(exam)}
              className="whitespace-nowrap text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Topics</h3>
            <div className="flex flex-wrap gap-2">
              {exam.topics.map((topic, i) => (
                <div key={i} className="bg-accent rounded px-2 py-1 text-xs">
                  {topic}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Difficulty</h3>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${
                exam.difficulty === 'Easy' 
                  ? 'bg-green-500' 
                  : exam.difficulty === 'Medium'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`} />
              {exam.difficulty}
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Question Types</h3>
          <p className="text-sm">{exam.questionTypes}</p>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Exam Status</h3>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              exam.isActive 
                ? 'bg-green-500' 
                : 'bg-yellow-500'
            }`} />
            {exam.isActive 
              ? 'Available to take now' 
              : 'Not available yet - will be active at the scheduled time'
            }
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          This exam will be available to take at the scheduled time. You can take the exam anytime after it becomes available.
        </div>
      </CardFooter>
    </Card>
  );
};

export default ExamCard;
