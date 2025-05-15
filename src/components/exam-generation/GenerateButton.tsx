
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface GenerateButtonProps {
  isGeneratingQuestions: boolean;
  isDisabled: boolean;
  disabledReason: string;
  onGenerate: () => void;
}

const GenerateButton: React.FC<GenerateButtonProps> = ({
  isGeneratingQuestions,
  isDisabled,
  disabledReason,
  onGenerate,
}) => {
  const handleClick = () => {
    if (isDisabled) {
      toast({
        title: "Cannot Generate Exam",
        description: disabledReason,
        variant: "destructive",
      });
      return;
    }
    
    if (!isGeneratingQuestions) {
      toast({
        title: "Generating Exam",
        description: "Please wait while we create your exam...",
      });
    }
    
    onGenerate();
  };
  
  return (
    <div className="flex flex-col items-center pt-4 space-y-2">
      <Button 
        size="lg" 
        onClick={handleClick} 
        disabled={isGeneratingQuestions}
        className={isGeneratingQuestions ? "opacity-70" : "bg-blue-600 hover:bg-blue-700"}
      >
        {isGeneratingQuestions ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
          </>
        ) : (
          <>
            <FileText className="mr-2 h-4 w-4" /> Generate & Save Exam
          </>
        )}
      </Button>

      {isDisabled && !isGeneratingQuestions && (
        <p className="text-sm text-destructive font-medium">{disabledReason}</p>
      )}
      
      {isGeneratingQuestions && (
        <p className="text-sm text-muted-foreground">
          This may take a moment. We're creating high-quality questions based on your input...
        </p>
      )}
    </div>
  );
};

export default GenerateButton;
