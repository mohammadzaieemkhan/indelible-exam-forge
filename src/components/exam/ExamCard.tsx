
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IExam } from "@/components/ExamTabs";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import DeleteExamHandler from "./DeleteExamHandler";

// Extend the IExam interface with the properties we need
interface ExamCardProps {
  exam: IExam;
  onView?: () => void;
  onTake?: () => void;
  onRefresh?: () => void;
}

const ExamCard = ({ exam, onView, onTake, onRefresh }: ExamCardProps) => {
  // Get formatted date
  const formattedDate = exam.date ? new Date(exam.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : "No date";

  // Determine exam status (past, present, future)
  const now = new Date().getTime();
  const examDate = exam.date ? new Date(exam.date).getTime() : 0;
  const isPast = examDate < now && examDate !== 0;
  const isToday = examDate !== 0 && 
                 new Date(examDate).toDateString() === new Date().toDateString();

  // Get the description and total questions if they exist or set defaults
  const description = exam.hasOwnProperty('description') ? exam.description : 
                      exam.hasOwnProperty('topics') ? exam.topics?.join(', ') : 
                      "No description provided";
                      
  const totalQuestions = exam.hasOwnProperty('totalQuestions') ? exam.totalQuestions : 
                        exam.hasOwnProperty('numberOfQuestions') ? exam.numberOfQuestions : 
                        undefined;

  return (
    <Card className={`overflow-hidden border ${
      isPast ? 'border-gray-200' : 
      isToday ? 'border-primary' : 
      'border-blue-200'
    }`}>
      <CardHeader className={`pb-3 ${
        isPast ? '' : 
        isToday ? 'bg-primary/5 border-b border-primary/20' : 
        'bg-blue-50 dark:bg-blue-950/20'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1" title={exam.name}>{exam.name}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              <span>{formattedDate}</span>
              {exam.duration && (
                <>
                  <Clock className="h-3.5 w-3.5 ml-3 mr-1 text-muted-foreground" />
                  <span>{exam.duration} min</span>
                </>
              )}
            </CardDescription>
          </div>
          <DeleteExamHandler examId={exam.id} variant="icon" size="sm" onDelete={onRefresh} />
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="text-sm">
          <p className="line-clamp-2 text-muted-foreground">
            {description}
          </p>
          
          {totalQuestions && (
            <div className="mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {totalQuestions} questions
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4 bg-muted/50">
        <Button variant="outline" onClick={onView}>
          View Details
        </Button>
        {onTake && (
          <Button onClick={onTake} className="gap-1">
            <span>{isPast ? "Review" : "Take Exam"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExamCard;
