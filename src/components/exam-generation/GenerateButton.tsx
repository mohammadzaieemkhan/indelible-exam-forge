
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  return (
    <div className="flex flex-col items-center pt-4 space-y-2">
      <Button size="lg" onClick={onGenerate} disabled={isDisabled}>
        {isGeneratingQuestions ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
          </>
        ) : (
          "Generate & Save Exam"
        )}
      </Button>

      {isDisabled && !isGeneratingQuestions && (
        <p className="text-sm text-muted-foreground">{disabledReason}</p>
      )}
    </div>
  );
};

export default GenerateButton;
