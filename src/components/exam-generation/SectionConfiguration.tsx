
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ExamSection from "@/components/ExamSection";

interface SectionConfigurationProps {
  useSections: boolean;
  setUseSections: (useSections: boolean) => void;
  sections: any[];
  handleAddSection: () => void;
  handleUpdateSection: (sectionIndex: number, updatedSection: any) => void;
  handleRemoveSection: (sectionIndex: number) => void;
  availableTopics: string[];
}

const SectionConfiguration: React.FC<SectionConfigurationProps> = ({
  useSections,
  setUseSections,
  sections,
  handleAddSection,
  handleUpdateSection,
  handleRemoveSection,
  availableTopics,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="use-sections"
          checked={useSections}
          onCheckedChange={(checked) => setUseSections(!!checked)}
        />
        <Label htmlFor="use-sections" className="font-medium">
          Enable Exam Sections
        </Label>
      </div>

      {useSections && sections.length === 0 && (
        <Alert variant="destructive" className="bg-yellow-500/10 border-yellow-500/20 text-yellow-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            When sections are enabled, you need to add at least one section
          </AlertDescription>
        </Alert>
      )}

      {useSections && (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <ExamSection
              key={index}
              sectionIndex={index}
              section={section}
              availableTopics={availableTopics}
              onUpdate={handleUpdateSection}
              onRemove={handleRemoveSection}
            />
          ))}

          <Button variant="outline" onClick={handleAddSection} className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Add Section
          </Button>
        </div>
      )}
    </div>
  );
};

export default SectionConfiguration;
