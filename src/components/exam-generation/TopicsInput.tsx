
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import SyllabusUploader from "@/components/SyllabusUploader";

interface TopicsInputProps {
  topics: string[];
  setTopics: (topics: string[]) => void;
  onTopicsExtracted: (topics: string[]) => void;
  onSyllabusContent: (content: string) => void;
}

const TopicsInput: React.FC<TopicsInputProps> = ({
  topics,
  setTopics,
  onTopicsExtracted,
  onSyllabusContent,
}) => {
  const [newTopic, setNewTopic] = useState<string>("");

  const handleAddTopic = () => {
    if (newTopic && !topics.includes(newTopic)) {
      setTopics([...topics, newTopic]);
      setNewTopic("");
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter((topic) => topic !== topicToRemove));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-1">
        Step 2: Syllabus Input
        <span className="text-sm font-medium text-red-500">*</span>
      </h3>

      {topics.length === 0 && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            At least one topic is required to generate an exam
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Topic Input */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              Topics
              <span className="text-sm font-medium text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md mt-1 min-h-[100px]">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="bg-primary/20 text-primary rounded-full px-3 py-1 text-sm flex items-center gap-2"
                >
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
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTopic())
                }
                className="flex-1 min-w-[100px] border-none p-0 h-8"
                placeholder="Add topic..."
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">
                Enter topics and press Enter to add them
              </p>
              {newTopic && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTopic}
                  className="text-xs h-7 px-2"
                >
                  Add Topic
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: File Upload */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Upload Syllabus (Optional)</label>
            <SyllabusUploader
              onTopicsExtracted={onTopicsExtracted}
              onSyllabusContent={onSyllabusContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicsInput;
