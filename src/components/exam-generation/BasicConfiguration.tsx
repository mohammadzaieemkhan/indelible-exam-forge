
import React from "react";
import NumberOfQuestionsSelector from "./NumberOfQuestionsSelector";
import DifficultySelector from "./DifficultySelector";
import QuestionTypeSelector from "./QuestionTypeSelector";

interface BasicConfigurationProps {
  numberOfQuestions: number;
  handleNumberOfQuestionsChange: (value: number[]) => void;
  handleNumberOfQuestionsInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  difficultyLevel: string;
  setDifficultyLevel: (level: string) => void;
  questionTypes: {
    mcq: boolean;
    truefalse: boolean;
    shortanswer: boolean;
    essay: boolean;
  };
  handleQuestionTypeChange: (type: string, checked: boolean) => void;
}

const BasicConfiguration: React.FC<BasicConfigurationProps> = ({
  numberOfQuestions,
  handleNumberOfQuestionsChange,
  handleNumberOfQuestionsInputChange,
  difficultyLevel,
  setDifficultyLevel,
  questionTypes,
  handleQuestionTypeChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <NumberOfQuestionsSelector
          numberOfQuestions={numberOfQuestions}
          handleNumberOfQuestionsChange={handleNumberOfQuestionsChange}
          handleNumberOfQuestionsInputChange={handleNumberOfQuestionsInputChange}
        />
        
        <DifficultySelector
          difficultyLevel={difficultyLevel}
          setDifficultyLevel={setDifficultyLevel}
        />
      </div>
      
      <div className="space-y-4">
        <QuestionTypeSelector
          questionTypes={questionTypes}
          handleQuestionTypeChange={handleQuestionTypeChange}
        />
      </div>
    </div>
  );
};

export default BasicConfiguration;
