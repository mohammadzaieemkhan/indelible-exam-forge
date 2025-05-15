
import React, { useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Edit, FileText, Trash2, Copy } from "lucide-react";
import { IExam } from "@/components/ExamTabs";
import ExamSectionedRenderer from "./ExamSectionedRenderer";
import ExamHandwrittenUploadHandler from "./ExamHandwrittenUploadHandler";

interface ExamCardProps {
  exam: IExam;
  onDeleteClick: () => void;
  onEditClick: () => void;
  onDuplicateClick: () => void;
}

const ExamCardWithHandwritten = ({ exam, onDeleteClick, onEditClick, onDuplicateClick }: ExamCardProps) => {
  const examWindowRef = useRef<Window | null>(null);
  
  // Create the exam renderer
  const { handleViewExam } = ExamSectionedRenderer({ 
    exam,
    onExamWindowOpen: (window) => {
      examWindowRef.current = window;
    }
  });

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="truncate">{exam.name}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            {exam.date} {exam.time && `at ${exam.time}`}
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2" />
            {exam.duration} minutes
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {exam.description || "No description provided."}
          </p>
          {exam.topics && exam.topics.length > 0 && (
            <div className="text-sm">
              <span className="font-medium">Topics:</span>{" "}
              {Array.isArray(exam.topics) ? exam.topics.join(", ") : exam.topics}
            </div>
          )}
          {exam.difficulty && (
            <div className="text-sm">
              <span className="font-medium">Difficulty:</span> {exam.difficulty}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" onClick={onEditClick}>
            <Edit className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:inline-block">Edit</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onDuplicateClick}>
            <Copy className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:inline-block">Copy</span>
          </Button>
          <Button size="sm" variant="outline" onClick={onDeleteClick}>
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:inline-block">Delete</span>
          </Button>
        </div>
        <Button size="sm" onClick={handleViewExam} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-1" />
          <span>Take Exam</span>
        </Button>
      </CardFooter>

      {/* Handles the handwritten answer uploads */}
      <ExamHandwrittenUploadHandler examWindowRef={examWindowRef} />
    </Card>
  );
};

export default ExamCardWithHandwritten;
