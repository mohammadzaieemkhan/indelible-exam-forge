
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Image } from "lucide-react";
import { extractTextFromImage, fileToBase64 } from "@/utils/ocrUtils";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadButtonProps {
  onTextExtracted: (text: string) => void;
}

const ImageUploadButton = ({ onTextExtracted }: ImageUploadButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Convert image to base64
      const base64 = await fileToBase64(file);
      
      // Extract text from image
      const result = await extractTextFromImage(base64);
      
      if (result.success && result.text) {
        onTextExtracted(result.text);
        toast({
          title: "Text extracted successfully",
          description: "Text has been extracted from the image and added to your answer."
        });
      } else {
        throw new Error(result.error || "Failed to extract text");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Text extraction failed",
        description: error.message || "Failed to extract text from image",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear the input to allow re-uploading the same file
      e.target.value = '';
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        id="image-upload" 
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      <label htmlFor="image-upload">
        <Button 
          type="button" 
          variant="outline"
          className="cursor-pointer"
          disabled={isUploading}
          asChild
        >
          <span>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting text...
              </>
            ) : (
              <>
                <Image className="mr-2 h-4 w-4" />
                Upload from Photo
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
};

export default ImageUploadButton;
