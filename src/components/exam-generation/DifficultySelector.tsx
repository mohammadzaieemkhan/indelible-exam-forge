
import React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface DifficultySelectorProps {
  difficultyLevel: string;
  setDifficultyLevel: (level: string) => void;
}

const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  difficultyLevel,
  setDifficultyLevel,
}) => {
  return (
    <div>
      <Label>Difficulty</Label>
      <RadioGroup
        value={difficultyLevel}
        onValueChange={setDifficultyLevel}
        className="flex flex-row gap-4 mt-2"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="easy" id="easy" />
          <Label htmlFor="easy">Easy</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="medium" id="medium" />
          <Label htmlFor="medium">Medium</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="hard" id="hard" />
          <Label htmlFor="hard">Hard</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default DifficultySelector;
