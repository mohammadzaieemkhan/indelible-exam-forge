
import React from "react";
import { Bell, FileText, Trash2, Trophy, Calendar, Clock, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { IExam } from "@/components/ExamTabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExamCardProps {
  exam: IExam;
  onSendReminder: (exam: IExam) => void;
  onDeleteClick: (exam: IExam) => void;
  onViewExam: (exam: IExam) => void;
}

const ExamCard = ({ exam, onSendReminder, onDeleteClick, onViewExam }: ExamCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 10 
      }}
    >
      <Card className="border border-border/40 overflow-hidden group relative">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r opacity-10 pointer-events-none transition-opacity duration-300 group-hover:opacity-25",
          exam.difficulty === 'Easy' 
            ? "from-green-400/20 to-emerald-500/20" 
            : exam.difficulty === 'Medium'
              ? "from-yellow-400/20 to-amber-500/20"
              : "from-red-400/20 to-rose-500/20"
        )} />

        <CardHeader className="pb-2">
          <div className="flex flex-col gap-2">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                {exam.name}
                {exam.isActive && (
                  <motion.span 
                    className="inline-flex h-2 w-2 rounded-full bg-green-500"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center">
                  <Calendar className="h-3 w-3 mr-1 text-muted-foreground" /> 
                  {exam.date}
                </span>
                <span className="inline-flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" /> 
                  {exam.time}
                </span>
                <span className="inline-flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-muted-foreground" /> 
                  {exam.duration} min
                </span>
                <span className="inline-flex items-center">
                  <List className="h-3 w-3 mr-1 text-muted-foreground" /> 
                  {exam.numberOfQuestions} questions
                </span>
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {exam.isActive ? (
                <Button 
                  variant="outline" 
                  onClick={() => onViewExam(exam)} 
                  size="sm"
                  className="whitespace-nowrap hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Take Exam
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  disabled 
                  size="sm"
                  className="whitespace-nowrap opacity-60"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Not Available Yet
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => onSendReminder(exam)} 
                size="sm"
                className="whitespace-nowrap hover:bg-blue-500/10"
              >
                <Bell className="h-4 w-4 mr-2" />
                Remind Me
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onDeleteClick(exam)}
                size="sm"
                className="whitespace-nowrap text-destructive hover:text-destructive-foreground hover:bg-destructive"
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
              <h3 className="text-sm font-semibold mb-2 flex items-center">
                <Trophy className="h-4 w-4 mr-2 text-primary" />
                Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {exam.topics.map((topic, i) => (
                  <motion.div 
                    key={i} 
                    className="bg-accent/50 rounded-full px-2 py-1 text-xs hover:bg-accent transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {topic}
                  </motion.div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">Difficulty</h3>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${
                  exam.difficulty === 'Easy' 
                    ? 'bg-green-500' 
                    : exam.difficulty === 'Medium'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`} />
                <span className={cn(
                  "font-medium",
                  exam.difficulty === 'Easy' 
                    ? 'text-green-500' 
                    : exam.difficulty === 'Medium'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                )}>
                  {exam.difficulty}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Question Types</h3>
            <p className="text-sm">{exam.questionTypes}</p>
          </div>
          
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Exam Status</h3>
            <div className="flex items-center gap-2">
              {exam.isActive ? (
                <motion.div 
                  className="h-2 w-2 rounded-full bg-green-500"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              ) : (
                <motion.div 
                  className="h-2 w-2 rounded-full bg-yellow-500"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              <span className="text-sm">
                {exam.isActive 
                  ? 'Available to take now' 
                  : 'Not available yet - will be active at the scheduled time'
                }
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            This exam will be available to take at the scheduled time. You can take the exam anytime after it becomes available.
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ExamCard;
