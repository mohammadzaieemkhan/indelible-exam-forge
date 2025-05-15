
import React from "react";
import { IExam } from "@/components/ExamTabs";
import DeleteExamDialog from "@/components/exam/DeleteExamDialog"; // Fix import
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Copy } from "lucide-react";
import ExamCardWithHandwritten from "@/components/exam/ExamCardWithHandwritten";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onDeleteExam: (examId: string) => void;
  onEditExam: (examId: string) => void;
  onDuplicateExam: (examId: string) => void;
}

const UpcomingExamsTab = ({ exams, onDeleteExam, onEditExam, onDuplicateExam }: UpcomingExamsTabProps) => {
  // Use our custom ExamCardWithHandwritten component instead of ExamCard
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {exams.length > 0 ? (
        exams.map((exam) => (
          <ExamCardWithHandwritten
            key={exam.id}
            exam={exam}
            onDeleteClick={() => onDeleteExam(exam.id!)}
            onEditClick={() => onEditExam(exam.id!)}
            onDuplicateClick={() => onDuplicateExam(exam.id!)}
          />
        ))
      ) : (
        <Card className="col-span-full">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No upcoming exams found.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => document.getElementById("create-exam-tab")?.click()}
                className="inline-flex items-center"
              >
                <Edit className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById("generate-exam-tab")?.click()}
                className="inline-flex items-center"
              >
                <Copy className="mr-2 h-4 w-4" />
                Generate Exam
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UpcomingExamsTab;
