
import ExamTabs from "@/components/ExamTabs";
import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Bell } from "lucide-react";

const DashboardPage = () => {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Exam Dashboard</h1>
          <p className="text-muted-foreground">Create, manage and track performance on your exams</p>
        </div>
        
        {/* Quick stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
          <Card className="p-4 flex items-center gap-3 bg-primary/5">
            <div className="bg-primary/10 p-2 rounded-full">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Create Exams</p>
              <p className="text-xs text-muted-foreground">Based on your syllabus</p>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-3 bg-primary/5">
            <div className="bg-primary/10 p-2 rounded-full">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Schedule Tests</p>
              <p className="text-xs text-muted-foreground">Set dates and times</p>
            </div>
          </Card>
          
          <Card className="p-4 flex items-center gap-3 bg-primary/5">
            <div className="bg-primary/10 p-2 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Get Notified</p>
              <p className="text-xs text-muted-foreground">WhatsApp reminders</p>
            </div>
          </Card>
        </div>
      </div>
      
      <ExamTabs />
    </div>
  );
};

export default DashboardPage;
