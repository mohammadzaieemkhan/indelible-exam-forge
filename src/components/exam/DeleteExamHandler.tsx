
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DeleteExamHandlerProps {
  examId: string;
  onDelete?: () => void;
  variant?: 'icon' | 'button' | 'text';
  size?: 'sm' | 'md' | 'lg';
}

const DeleteExamHandler: React.FC<DeleteExamHandlerProps> = ({
  examId,
  onDelete,
  variant = 'button',
  size = 'md',
}) => {
  const { toast } = useToast();
  
  const handleDelete = () => {
    if (!examId) {
      toast({
        title: "Error",
        description: "Cannot delete: Missing exam ID",
        variant: "destructive",
      });
      return;
    }
    
    // Confirm before deleting
    const confirmDelete = window.confirm("Are you sure you want to delete this exam?");
    
    if (confirmDelete) {
      try {
        // For upcoming exams
        const savedExams = localStorage.getItem('upcomingExams');
        if (savedExams) {
          const exams = JSON.parse(savedExams);
          const updatedExams = exams.filter(exam => exam.id !== examId);
          localStorage.setItem('upcomingExams', JSON.stringify(updatedExams));
        }
        
        // For exam results in performance tab
        const examResults = localStorage.getItem('examResults');
        if (examResults) {
          const results = JSON.parse(examResults);
          const updatedResults = results.filter(result => result.examId !== examId);
          localStorage.setItem('examResults', JSON.stringify(updatedResults));
        }
        
        // Execute callback if provided
        if (onDelete) {
          onDelete();
        }
        
        toast({
          title: "Exam Deleted",
          description: "The exam has been successfully deleted",
        });
      } catch (error) {
        console.error("Error deleting exam:", error);
        toast({
          title: "Delete Failed",
          description: "Could not delete the exam. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Icon only button
  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size={size === 'lg' ? 'default' : size === 'md' ? 'sm' : 'icon'}
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
      >
        <Trash className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <span className="sr-only">Delete</span>
      </Button>
    );
  }
  
  // Text only
  if (variant === 'text') {
    return (
      <button
        onClick={handleDelete}
        className="text-red-500 hover:text-red-700 font-medium flex items-center"
      >
        <Trash className="mr-1 h-4 w-4" />
        <span>Delete</span>
      </button>
    );
  }
  
  // Default button
  return (
    <Button 
      variant="destructive" 
      size={size === 'lg' ? 'default' : 'sm'} 
      onClick={handleDelete}
      className="flex items-center"
    >
      <Trash className="mr-1 h-4 w-4" />
      <span>Delete</span>
    </Button>
  );
};

export default DeleteExamHandler;
