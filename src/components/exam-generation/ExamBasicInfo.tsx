
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ExamBasicInfoProps {
  examName: string;
  setExamName: (name: string) => void;
  examDate: string;
  setExamDate: (date: string) => void;
  examTime: string;
  setExamTime: (time: string) => void;
  examDuration: number;
  setExamDuration: (duration: number) => void;
  formErrors: {
    date?: string;
    time?: string;
  };
  handleDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTimeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDurationChange: (value: number[]) => void;
  handleDurationInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ExamBasicInfo: React.FC<ExamBasicInfoProps> = ({
  examName,
  setExamName,
  examDate,
  examTime,
  examDuration,
  formErrors,
  handleDateChange,
  handleTimeChange,
  handleDurationChange,
  handleDurationInputChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Step 1: Exam Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Exam Name</Label>
          <Input
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            className="w-full mt-1"
          />
        </div>
        <div>
          <Label className="flex items-center">
            Exam Date <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="date"
            value={examDate}
            onChange={handleDateChange}
            className={cn("w-full mt-1", formErrors.date && "border-red-500")}
          />
          {formErrors.date && (
            <p className="text-xs text-red-500 mt-1">{formErrors.date}</p>
          )}
        </div>
        <div>
          <Label className="flex items-center">
            Exam Time <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            type="time"
            value={examTime}
            onChange={handleTimeChange}
            className={cn("w-full mt-1", formErrors.time && "border-red-500")}
          />
          {formErrors.time && (
            <p className="text-xs text-red-500 mt-1">{formErrors.time}</p>
          )}
        </div>
        <div>
          <Label>Duration (minutes)</Label>
          <div className="flex items-center gap-4">
            <Slider
              min={15}
              max={180}
              step={5}
              className="flex-1"
              value={[examDuration]}
              onValueChange={handleDurationChange}
            />
            <Input
              type="number"
              className="w-20"
              min={15}
              max={180}
              value={examDuration}
              onChange={handleDurationInputChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamBasicInfo;
