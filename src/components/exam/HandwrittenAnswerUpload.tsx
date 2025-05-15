
import React, { useState } from 'react';
import { Upload, ImageIcon, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HandwrittenAnswerUploadProps {
  onTextExtracted: (text: string) => void;
}

const HandwrittenAnswerUpload: React.FC<HandwrittenAnswerUploadProps> = ({ onTextExtracted }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a preview of the image
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Convert file to base64
      const base64Image = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      
      // Send to our edge function for processing
      const { data, error } = await supabase.functions.invoke('process-handwritten-text', {
        body: { imageData: base64Image }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success || !data.extractedText) {
        throw new Error('Failed to extract text from image');
      }
      
      // Pass the extracted text to the parent component
      onTextExtracted(data.extractedText);
      
      toast({
        title: "Text extracted successfully",
        description: "Your handwritten answer has been processed",
      });
    } catch (error) {
      console.error('Error processing handwritten answer:', error);
      toast({
        title: "Error processing image",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isUploading}
          onClick={() => document.getElementById('handwritten-answer-upload')?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> 
              Processing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> 
              Upload handwritten answer
            </>
          )}
        </Button>
        <input
          id="handwritten-answer-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>
      
      {imagePreview && (
        <div className="mt-2 relative">
          <img 
            src={imagePreview} 
            alt="Handwritten answer preview" 
            className="max-h-[200px] rounded-md border border-border" 
          />
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 p-0 rounded-full bg-background/80"
            onClick={() => setImagePreview(null)}
          >
            ×
          </Button>
        </div>
      )}
    </div>
  );
};

export default HandwrittenAnswerUpload;
