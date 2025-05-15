
import React from "react";
import { IExam } from "@/components/ExamTabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import ExamCardWithHandwritten from "@/components/exam/ExamCardWithHandwritten";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onDeleteExam: (examId: string) => void;
  onEditExam: (examId: string) => void;
  onDuplicateExam: (examId: string) => void;
}

const UpcomingExamsTab = ({ exams, onDeleteExam, onEditExam, onDuplicateExam }: UpcomingExamsTabProps) => {
  // Function to handle redirect to the generate exam tab
  const handleRedirectToGenerateExam = () => {
    // Find the generate exam tab element and trigger a click
    const generateExamTab = document.getElementById("generate-exam-tab");
    if (generateExamTab) {
      generateExamTab.click();
    }
  };

  // Filter active exams only
  const activeExams = exams.filter(exam => exam.isActive === true);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {activeExams.length > 0 ? (
        activeExams.map((exam) => (
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
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleRedirectToGenerateExam}
                className="inline-flex items-center"
              >
                <FileText className="mr-2 h-4 w-4" />
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
