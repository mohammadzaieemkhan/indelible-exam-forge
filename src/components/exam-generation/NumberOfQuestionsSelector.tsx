
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface NumberOfQuestionsSelectorProps {
  numberOfQuestions: number;
  handleNumberOfQuestionsChange: (value: number[]) => void;
  handleNumberOfQuestionsInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const NumberOfQuestionsSelector: React.FC<NumberOfQuestionsSelectorProps> = ({
  numberOfQuestions,
  handleNumberOfQuestionsChange,
  handleNumberOfQuestionsInputChange,
}) => {
  return (
    <div>
      <Label>Number of Questions</Label>
      <div className="flex items-center gap-4">
        <Slider
          min={1}
          max={50}
          step={1}
          className="flex-1"
          value={[numberOfQuestions]}
          onValueChange={handleNumberOfQuestionsChange}
        />
        <Input
          type="number"
          className="w-20"
          min={1}
          max={50}
          value={numberOfQuestions}
          onChange={handleNumberOfQuestionsInputChange}
        />
      </div>
    </div>
  );
};

export default NumberOfQuestionsSelector;
