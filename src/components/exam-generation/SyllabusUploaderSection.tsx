
import React from "react";
import SyllabusUploader from "@/components/SyllabusUploader";

interface SyllabusUploaderSectionProps {
  onTopicsExtracted: (topics: string[]) => void;
  onSyllabusContent: (content: string) => void;
}

const SyllabusUploaderSection: React.FC<SyllabusUploaderSectionProps> = ({
  onTopicsExtracted,
  onSyllabusContent,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Step 2: Syllabus Upload (Optional)</h3>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Upload Syllabus</label>
          <SyllabusUploader
            onTopicsExtracted={onTopicsExtracted}
            onSyllabusContent={onSyllabusContent}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Extracted topics will be available to add to your sections
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyllabusUploaderSection;
