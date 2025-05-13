
import { useState } from "react";
import { X, Plus, ListCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export interface ExamSectionProps {
  sectionIndex: number;
  section: {
    title: string;
    topics: string[];
    questionTypes: string[];
    numberOfQuestions: number;
    difficulty: string;
  };
  availableTopics: string[];
  onUpdate: (sectionIndex: number, updatedSection: any) => void;
  onRemove: (sectionIndex: number) => void;
}

const ExamSection = ({
  sectionIndex,
  section,
  availableTopics,
  onUpdate,
  onRemove
}: ExamSectionProps) => {
  const [newTopic, setNewTopic] = useState<string>("");
  
  // Handle section title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(sectionIndex, {
      ...section,
      title: e.target.value
    });
  };
  
  // Handle question count change
  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value) || 0;
    onUpdate(sectionIndex, {
      ...section,
      numberOfQuestions: count
    });
  };
  
  // Handle adding a topic to this section
  const handleAddTopic = () => {
    if (newTopic && !section.topics.includes(newTopic)) {
      onUpdate(sectionIndex, {
        ...section,
        topics: [...section.topics, newTopic]
      });
      setNewTopic("");
    }
  };
  
  // Handle adding an available topic from the global list
  const handleAddAvailableTopic = (topic: string) => {
    if (!section.topics.includes(topic)) {
      onUpdate(sectionIndex, {
        ...section,
        topics: [...section.topics, topic]
      });
    }
  };
  
  // Handle removing a topic from this section
  const handleRemoveTopic = (topicToRemove: string) => {
    onUpdate(sectionIndex, {
      ...section,
      topics: section.topics.filter(topic => topic !== topicToRemove)
    });
  };
  
  // Handle question type toggle
  const handleQuestionTypeChange = (type: string, checked: boolean) => {
    let updatedTypes = [...section.questionTypes];
    
    if (checked && !updatedTypes.includes(type)) {
      updatedTypes.push(type);
    } else if (!checked) {
      updatedTypes = updatedTypes.filter(t => t !== type);
    }
    
    onUpdate(sectionIndex, {
      ...section,
      questionTypes: updatedTypes
    });
  };
  
  // Handle difficulty change
  const handleDifficultyChange = (difficulty: string, checked: boolean) => {
    onUpdate(sectionIndex, {
      ...section,
      difficulty: checked ? difficulty : "medium" // Default to medium if unchecked
    });
  };
  
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          <Input 
            value={section.title || `Section ${sectionIndex + 1}`}
            onChange={handleTitleChange}
            placeholder={`Section ${sectionIndex + 1}`}
            className="font-semibold"
          />
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(sectionIndex)}
          className="text-destructive hover:bg-destructive/10"
        >
          <X size={16} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Number of questions */}
        <div>
          <Label>Number of Questions</Label>
          <Input 
            type="number" 
            value={section.numberOfQuestions}
            onChange={handleQuestionCountChange}
            min={1}
            max={50}
            className="w-full mt-1"
          />
        </div>
        
        {/* Topics */}
        <div>
          <Label>Topics for This Section</Label>
          <div className="flex gap-2 mt-1">
            <Input 
              placeholder="Add topic..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
              className="flex-1"
              list="available-topics"
            />
            <datalist id="available-topics">
              {availableTopics.map((topic, i) => (
                <option key={i} value={topic} />
              ))}
            </datalist>
            <Button type="button" onClick={handleAddTopic}>Add</Button>
          </div>
          
          {/* Available topics from global list */}
          {availableTopics.length > 0 && (
            <div className="mt-2">
              <Label className="text-sm text-muted-foreground">Available Topics:</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {availableTopics.map((topic, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className={`text-xs h-7 px-2 ${section.topics.includes(topic) ? 'bg-primary/20' : ''}`}
                    onClick={() => handleAddAvailableTopic(topic)}
                  >
                    <ListCheck className="h-3 w-3 mr-1" />
                    {topic}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            {section.topics.map((topic, index) => (
              <div key={index} className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2">
                {topic}
                <button 
                  type="button"
                  onClick={() => handleRemoveTopic(topic)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
            {section.topics.length === 0 && (
              <div className="text-sm text-muted-foreground">No topics selected</div>
            )}
          </div>
        </div>
        
        {/* Question Types */}
        <div>
          <Label>Question Types</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`mcq-${sectionIndex}`} 
                checked={section.questionTypes.includes("mcq")}
                onCheckedChange={(checked) => 
                  handleQuestionTypeChange("mcq", !!checked)
                }
              />
              <Label htmlFor={`mcq-${sectionIndex}`}>Multiple Choice</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`truefalse-${sectionIndex}`} 
                checked={section.questionTypes.includes("truefalse")}
                onCheckedChange={(checked) => 
                  handleQuestionTypeChange("truefalse", !!checked)
                }
              />
              <Label htmlFor={`truefalse-${sectionIndex}`}>True/False</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`shortanswer-${sectionIndex}`} 
                checked={section.questionTypes.includes("shortanswer")}
                onCheckedChange={(checked) => 
                  handleQuestionTypeChange("shortanswer", !!checked)
                }
              />
              <Label htmlFor={`shortanswer-${sectionIndex}`}>Short Answer</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`essay-${sectionIndex}`} 
                checked={section.questionTypes.includes("essay")}
                onCheckedChange={(checked) => 
                  handleQuestionTypeChange("essay", !!checked)
                }
              />
              <Label htmlFor={`essay-${sectionIndex}`}>Essay</Label>
            </div>
          </div>
        </div>
        
        {/* Difficulty */}
        <div>
          <Label>Difficulty</Label>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`easy-${sectionIndex}`} 
                checked={section.difficulty === "easy"}
                onCheckedChange={(checked) => handleDifficultyChange("easy", !!checked)}
              />
              <Label htmlFor={`easy-${sectionIndex}`}>Easy</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`medium-${sectionIndex}`} 
                checked={section.difficulty === "medium"}
                onCheckedChange={(checked) => handleDifficultyChange("medium", !!checked)}
              />
              <Label htmlFor={`medium-${sectionIndex}`}>Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`hard-${sectionIndex}`} 
                checked={section.difficulty === "hard"}
                onCheckedChange={(checked) => handleDifficultyChange("hard", !!checked)}
              />
              <Label htmlFor={`hard-${sectionIndex}`}>Hard</Label>
            </div>
          </div>
        </div>
      </CardContent>
      <Separator className="my-2" />
    </Card>
  );
};

export default ExamSection;
