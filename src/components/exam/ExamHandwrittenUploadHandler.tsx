
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import HandwrittenAnswerUpload from './HandwrittenAnswerUpload';

interface ExamHandwrittenUploadHandlerProps {
  examWindowRef: React.RefObject<Window | null>;
}

const ExamHandwrittenUploadHandler: React.FC<ExamHandwrittenUploadHandlerProps> = ({ examWindowRef }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'requestHandwrittenUpload') {
        setCurrentQuestionIndex(event.data.questionIndex);
        setIsOpen(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleTextExtracted = (text: string) => {
    if (examWindowRef.current && currentQuestionIndex !== null) {
      examWindowRef.current.postMessage({
        type: 'extractedHandwrittenText',
        questionIndex: currentQuestionIndex,
        text
      }, '*');
      
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Handwritten Answer</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            Take a photo of your handwritten answer and upload it. We'll extract the text and add it to your answer.
          </p>
          <HandwrittenAnswerUpload onTextExtracted={handleTextExtracted} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamHandwrittenUploadHandler;
