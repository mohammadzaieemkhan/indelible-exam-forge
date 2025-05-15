
import React from "react";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface QuestionTypeSelectorProps {
  questionTypes: {
    mcq: boolean;
    truefalse: boolean;
    shortanswer: boolean;
    essay: boolean;
  };
  handleQuestionTypeChange: (type: string, checked: boolean) => void;
}

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  questionTypes,
  handleQuestionTypeChange,
}) => {
  return (
    <div className="space-y-4">
      <Label>Question Types</Label>
      <div className="space-y-2 mt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="mcq"
            checked={questionTypes.mcq}
            onCheckedChange={(checked) => handleQuestionTypeChange("mcq", !!checked)}
          />
          <Label htmlFor="mcq">Multiple Choice Questions</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="truefalse"
            checked={questionTypes.truefalse}
            onCheckedChange={(checked) => handleQuestionTypeChange("truefalse", !!checked)}
          />
          <Label htmlFor="truefalse">True/False Questions</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="shortanswer"
            checked={questionTypes.shortanswer}
            onCheckedChange={(checked) => handleQuestionTypeChange("shortanswer", !!checked)}
          />
          <Label htmlFor="shortanswer">Short Answer Questions</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="essay"
            checked={questionTypes.essay}
            onCheckedChange={(checked) => handleQuestionTypeChange("essay", !!checked)}
          />
          <Label htmlFor="essay">Essay Questions</Label>
        </div>
      </div>
    </div>
  );
};

export default QuestionTypeSelector;
