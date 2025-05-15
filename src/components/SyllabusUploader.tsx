
import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { fileToText, parseSyllabusContent } from "@/utils/apiService";

interface SyllabusUploaderProps {
  onTopicsExtracted: (topics: string[]) => void;
  onSyllabusContent: (content: string) => void;
}

const SyllabusUploader = ({ 
  onTopicsExtracted, 
  onSyllabusContent
}: SyllabusUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Check file type and size
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, TXT, or Word document",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setFile(selectedFile);
  };
  
  // Clear selected file
  const handleClearFile = () => {
    setFile(null);
  };
  
  // Process the file
  const handleProcessFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    
    try {
      // Convert file to text
      const fileContent = await fileToText(file);
      
      // Send to API for processing
      onSyllabusContent(fileContent);
      
      // Parse syllabus content to extract topics
      const result = await parseSyllabusContent(fileContent);
      
      if (result.success && result.topics) {
        // Clean up topics - remove any markdown formatting
        const cleanTopics = result.topics.map(topic => 
          topic.replace(/\*\*/g, '').trim()
        );
        
        onTopicsExtracted(cleanTopics);
        
        toast({
          title: "Syllabus Processed",
          description: `${cleanTopics.length} topics extracted`,
        });
      } else {
        throw new Error(result.error || "Failed to parse syllabus");
      }
    } catch (error) {
      console.error("Error processing syllabus:", error);
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process syllabus",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className={`
        border-2 border-dashed rounded-lg 
        flex flex-col items-center justify-center p-6 
        h-[100px] hover:bg-muted/50 transition-colors 
        ${file ? "bg-muted/30 border-primary" : "cursor-pointer"}
      `}
      onClick={() => {
        if (!file && !isProcessing) {
          document.getElementById('syllabus-upload')?.click();
        }
      }}
      >
        <input
          id="syllabus-upload"
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.txt,.doc,.docx"
        />
        
        {!file ? (
          <div className="text-center">
            <Upload className="mx-auto h-6 w-6 mb-1" />
            <p className="text-sm font-medium">Drag & drop or click to upload</p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, DOCX, TXT (Max 5MB)
            </p>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center">
              <div className="ml-2 overflow-hidden">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleClearFile();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {file && (
        <Button
          onClick={handleProcessFile}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Analyze Syllabus
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default SyllabusUploader;
