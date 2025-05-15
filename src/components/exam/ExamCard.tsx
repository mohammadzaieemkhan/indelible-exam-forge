
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IExam } from "@/components/ExamTabs";
import { Calendar, Clock, ArrowRight, Bell, Info, Clock3, Trash } from "lucide-react";
import DeleteExamHandler from "./DeleteExamHandler";
import { useToast } from "@/hooks/use-toast";

// Extend the IExam interface with the properties we need
interface ExamCardProps {
  exam: IExam;
  onView?: () => void;
  onTake?: () => void;
  onRefresh?: () => void;
  onSendReminder?: () => void;
  onDelete?: () => void;
}

const ExamCard = ({ exam, onView, onTake, onRefresh, onSendReminder, onDelete }: ExamCardProps) => {
  const { toast } = useToast();

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
  
  // Specifically check if the exam is currently active based on date and time
  const isActive = exam.isActive || (isToday && exam.time && 
    new Date().toTimeString().slice(0, 5) >= exam.time);
                 
  const formattedTime = exam.time || "No time set";

  // Get the description and total questions with safe type checking
  const description = 
    'description' in exam && exam.description ? 
      String(exam.description) : 
    'topics' in exam && exam.topics ? 
      exam.topics.join(', ') : 
      "No description provided";
                      
  const totalQuestions = 
    'totalQuestions' in exam && exam.totalQuestions ? 
      Number(exam.totalQuestions) : 
    'numberOfQuestions' in exam && exam.numberOfQuestions ? 
      Number(exam.numberOfQuestions) : 
      undefined;

  // Handle view details button
  const handleViewDetails = () => {
    if (onView) {
      onView();
    } else {
      toast({
        title: "Exam Details",
        description: `${exam.name}: ${description}`,
      });
    }
  };

  // Handle exam availability message
  const getAvailabilityMessage = () => {
    if (isPast) {
      return "This exam has already passed";
    }
    if (isActive) {
      return "This exam is available now";
    }
    if (isToday) {
      // If it's today but not active yet, show the time it will be available
      return `Available today at ${exam.time}`;
    }
    if (examDate !== 0) {
      const daysLeft = Math.ceil((examDate - now) / (1000 * 60 * 60 * 24));
      return `Available in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
    }
    return "No date set for this exam";
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Card className={`overflow-hidden border ${
      isPast ? 'border-gray-200' : 
      isActive ? 'border-primary' : 
      'border-blue-200'
    }`}>
      <CardHeader className={`pb-3 ${
        isPast ? '' : 
        isActive ? 'bg-primary/5 border-b border-primary/20' : 
        'bg-blue-50 dark:bg-blue-950/20'
      }`}>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="line-clamp-1" title={exam.name}>{exam.name}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center">
                <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <span>{formattedTime}</span>
              </span>
              {exam.duration && (
                <span className="flex items-center">
                  <Clock3 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <span>{exam.duration} min</span>
                </span>
              )}
            </CardDescription>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="text-sm">
          <p className="line-clamp-2 text-muted-foreground">
            {description}
          </p>
          
          <div className="mt-3 flex flex-wrap gap-2">
            {totalQuestions !== undefined && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {String(totalQuestions)} questions
              </span>
            )}
            
            <span className={`text-xs px-2 py-1 rounded-full ${
              isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 
              isPast ? 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400' :
              'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              {isActive ? 'Available now' : isPast ? 'Past exam' : 'Upcoming'}
            </span>
            
            {exam.difficulty && (
              <span className={`text-xs px-2 py-1 rounded-full ${
                exam.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                exam.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {exam.difficulty.charAt(0).toUpperCase() + exam.difficulty.slice(1)}
              </span>
            )}
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            {getAvailabilityMessage()}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4 bg-muted/50">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleViewDetails}>
            <Info className="h-4 w-4 mr-1" />
            Details
          </Button>
          
          {onSendReminder && !isPast && (
            <Button variant="outline" size="sm" onClick={onSendReminder}>
              <Bell className="h-4 w-4 mr-1" />
              Remind
            </Button>
          )}
        </div>
        
        {onTake && (
          <Button 
            onClick={onTake} 
            disabled={!isActive} 
            className="gap-1"
            variant={isActive ? "default" : "outline"}
          >
            <span>Take Exam</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ExamCard;
