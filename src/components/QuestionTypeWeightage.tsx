
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface QuestionType {
  id: string;
  name: string;
  enabled: boolean;
  weight: number;
}

interface QuestionTypeWeightageProps {
  onChange: (questionTypes: Record<string, {enabled: boolean, weight: number}>) => void;
}

const QuestionTypeWeightage = ({ onChange }: QuestionTypeWeightageProps) => {
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    { id: "mcq", name: "Multiple Choice", enabled: true, weight: 1 },
    { id: "truefalse", name: "True/False", enabled: false, weight: 1 },
    { id: "shortanswer", name: "Short Answer", enabled: false, weight: 2 },
    { id: "essay", name: "Essay", enabled: false, weight: 3 },
  ]);

  const handleTypeChange = (id: string, enabled: boolean) => {
    const updatedTypes = questionTypes.map(type => 
      type.id === id ? { ...type, enabled } : type
    );
    setQuestionTypes(updatedTypes);
    
    // Convert to the format the parent component expects
    const formattedTypes = updatedTypes.reduce((acc, type) => {
      acc[type.id] = { enabled: type.enabled, weight: type.weight };
      return acc;
    }, {} as Record<string, {enabled: boolean, weight: number}>);
    
    onChange(formattedTypes);
  };

  const handleWeightChange = (id: string, weight: number) => {
    const updatedTypes = questionTypes.map(type => 
      type.id === id ? { ...type, weight } : type
    );
    setQuestionTypes(updatedTypes);
    
    // Convert to the format the parent component expects
    const formattedTypes = updatedTypes.reduce((acc, type) => {
      acc[type.id] = { enabled: type.enabled, weight: type.weight };
      return acc;
    }, {} as Record<string, {enabled: boolean, weight: number}>);
    
    onChange(formattedTypes);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Question Types & Weightage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questionTypes.map((type) => (
          <div key={type.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id={`type-${type.id}`}
                  checked={type.enabled}
                  onCheckedChange={(checked) => 
                    handleTypeChange(type.id, !!checked)
                  }
                />
                <Label htmlFor={`type-${type.id}`} className="font-medium">
                  {type.name}
                </Label>
              </div>
              <div className="text-sm font-medium">
                Weight: {type.weight}x
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                disabled={!type.enabled}
                min={1}
                max={5}
                step={1}
                className="flex-1"
                value={[type.weight]}
                onValueChange={(value) => handleWeightChange(type.id, value[0])}
              />
              <Input
                type="number"
                className="w-16"
                min={1}
                max={5}
                value={type.weight}
                onChange={(e) => handleWeightChange(type.id, parseInt(e.target.value) || 1)}
                disabled={!type.enabled}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuestionTypeWeightage;
