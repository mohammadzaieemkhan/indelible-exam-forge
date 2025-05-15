
import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface QuestionWeightageProps {
  questionWeights: {
    mcq: number;
    truefalse: number;
    shortanswer: number;
    essay: number;
  };
  handleQuestionWeightChange: (type: string, weight: number) => void;
}

const QuestionWeightage: React.FC<QuestionWeightageProps> = ({
  questionWeights,
  handleQuestionWeightChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Step 4: Question Weightage</h3>
      <p className="text-sm text-muted-foreground">
        Set the weightage for each question type for performance analysis
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>MCQ Weightage</Label>
          <div className="flex items-center gap-4 mt-2">
            <Slider
              min={1}
              max={10}
              step={1}
              className="flex-1"
              value={[questionWeights.mcq]}
              onValueChange={(value) => handleQuestionWeightChange("mcq", value[0])}
            />
            <div className="w-10 text-center">{questionWeights.mcq}</div>
          </div>
        </div>

        <div>
          <Label>True/False Weightage</Label>
          <div className="flex items-center gap-4 mt-2">
            <Slider
              min={1}
              max={10}
              step={1}
              className="flex-1"
              value={[questionWeights.truefalse]}
              onValueChange={(value) => handleQuestionWeightChange("truefalse", value[0])}
            />
            <div className="w-10 text-center">{questionWeights.truefalse}</div>
          </div>
        </div>

        <div>
          <Label>Short Answer Weightage</Label>
          <div className="flex items-center gap-4 mt-2">
            <Slider
              min={1}
              max={10}
              step={1}
              className="flex-1"
              value={[questionWeights.shortanswer]}
              onValueChange={(value) => handleQuestionWeightChange("shortanswer", value[0])}
            />
            <div className="w-10 text-center">{questionWeights.shortanswer}</div>
          </div>
        </div>

        <div>
          <Label>Essay Weightage</Label>
          <div className="flex items-center gap-4 mt-2">
            <Slider
              min={1}
              max={10}
              step={1}
              className="flex-1"
              value={[questionWeights.essay]}
              onValueChange={(value) => handleQuestionWeightChange("essay", value[0])}
            />
            <div className="w-10 text-center">{questionWeights.essay}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionWeightage;
