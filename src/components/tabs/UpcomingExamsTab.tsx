
import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IExam } from "@/components/ExamTabs";

interface UpcomingExamsTabProps {
  exams: IExam[];
  onSendReminder: (exam: IExam) => void;
}

const UpcomingExamsTab = ({ exams, onSendReminder }: UpcomingExamsTabProps) => {
  const [selectedExamIndex, setSelectedExamIndex] = useState<string>("0");
  const [examContentDialogOpen, setExamContentDialogOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  
  // Handle exam selection in upcoming exams tab
  const handleExamSelect = (value: string) => {
    setSelectedExamIndex(value);
  };
  
  // Handle view exam content
  const handleViewExam = (exam: IExam) => {
    setSelectedExam(exam);
    setExamContentDialogOpen(true);
  };
  
  // Get current date for calendar view
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Month names
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Exams</CardTitle>
        <CardDescription>View and manage scheduled exams</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {/* Calendar Side */}
          <div className="md:col-span-5 border rounded-lg p-4">
            <div className="text-center mb-4">
              <h3 className="font-medium">{monthNames[currentMonth]} {currentYear}</h3>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Day labels */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-muted-foreground text-sm p-2">
                  {day}
                </div>
              ))}
              
              {/* Empty days from previous month */}
              {Array(firstDay).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="p-2 h-16" />
              ))}
              
              {/* Actual days */}
              {Array(daysInMonth).fill(null).map((_, i) => {
                // Check if any exams are scheduled for this day
                const dayExams = exams.filter(exam => {
                  const examDate = new Date(exam.date);
                  return examDate.getDate() === i + 1 && 
                         examDate.getMonth() === currentMonth && 
                         examDate.getFullYear() === currentYear;
                });
                
                const hasExam = dayExams.length > 0;
                
                return (
                  <div 
                    key={`day-${i+1}`}
                    className={`p-1 border rounded-md h-16 ${hasExam ? 'bg-primary/10 border-primary' : ''}`}
                  >
                    <div className="text-right text-sm">{i+1}</div>
                    {dayExams.map((exam, examIndex) => (
                      <button 
                        key={examIndex}
                        className="text-xs p-1 mt-1 bg-primary/20 text-primary rounded w-full text-left"
                        onClick={() => handleViewExam(exam)}
                      >
                        {exam.name}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Details Side */}
          <div className="md:col-span-2">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Exam Details</h3>
                {exams.length > 0 ? (
                  <Select 
                    value={selectedExamIndex} 
                    onValueChange={handleExamSelect}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Upcoming Exams</SelectLabel>
                        {exams.map((exam, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {exam.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">
                    No upcoming exams scheduled. Generate and save an exam first.
                  </p>
                )}
              </div>
              
              {exams.length > 0 && (
                <div className="border rounded-md p-4 space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.date} at {exams[parseInt(selectedExamIndex) || 0]?.time}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Duration:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.duration} minutes</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <p>{exams[parseInt(selectedExamIndex) || 0]?.isActive ? 
                      <span className="text-green-600 font-medium">Available</span> : 
                      <span className="text-amber-600 font-medium">Scheduled</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Topics:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {exams[parseInt(selectedExamIndex) || 0]?.topics.map((topic, i) => (
                        <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 flex space-x-2">
                    <Button 
                      size="sm"
                      disabled={!exams[parseInt(selectedExamIndex) || 0]?.isActive}
                      onClick={() => {
                        if (exams[parseInt(selectedExamIndex) || 0]) {
                          handleViewExam(exams[parseInt(selectedExamIndex) || 0]);
                        }
                      }}
                    >
                      {exams[parseInt(selectedExamIndex) || 0]?.isActive ? 
                        "Take Exam" : "Available Soon"}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (exams[parseInt(selectedExamIndex) || 0]) {
                          onSendReminder(exams[parseInt(selectedExamIndex) || 0]);
                        }
                      }}
                    >
                      <Bell className="h-4 w-4 mr-1" /> Send Reminder
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Exam Content Dialog */}
      <Dialog open={examContentDialogOpen} onOpenChange={setExamContentDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.name}</DialogTitle>
            <DialogDescription>
              {selectedExam?.date} at {selectedExam?.time} • {selectedExam?.duration} minutes
            </DialogDescription>
          </DialogHeader>
          {selectedExam?.questions ? (
            <div className="whitespace-pre-line">{selectedExam.questions}</div>
          ) : (
            <p className="text-muted-foreground">Exam content is not available</p>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UpcomingExamsTab;
