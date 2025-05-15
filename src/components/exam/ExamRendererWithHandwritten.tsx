
import React from "react";
import { ParsedQuestionItem, parseQuestions } from "./utils/examParser";
import { IExam } from "@/components/ExamTabs";
import { toast } from "@/components/ui/use-toast";
import { generateExamHtml } from "./ExamRenderer"; // Reuse the HTML generator

interface ExamRendererWithHandwrittenProps {
  exam: IExam;
  onExamWindowOpen?: (window: Window) => void;
}

const ExamRendererWithHandwritten = ({ exam, onExamWindowOpen }: ExamRendererWithHandwrittenProps) => {
  // Open exam in a new window
  const handleViewExam = () => {
    if (!exam.isActive) {
      toast({
        title: "Exam Not Available",
        description: "This exam will be available at the scheduled date and time.",
        variant: "destructive"
      });
      return;
    }
    
    // Create a new window for the exam
    const examWindow = window.open('', '_blank', 'width=1024,height=768,scrollbars=yes');
    
    if (!examWindow) {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site to take the exam.",
        variant: "destructive"
      });
      return;
    }
    
    // Call the callback to store the exam window reference
    if (onExamWindowOpen) {
      onExamWindowOpen(examWindow);
    }
    
    try {
      // Log the exam object to diagnose issues
      console.log("Rendering exam:", exam);
      
      // Check if questions exist and are in the right format
      if (!exam.questions) {
        toast({
          title: "No Questions Available",
          description: "This exam has no questions. Try generating the exam again.",
          variant: "destructive"
        });
        
        examWindow.document.open();
        examWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${exam.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .error { color: #e53e3e; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${exam.name}</h1>
            <p class="error">No questions are available for this exam.</p>
            <p>Please go back and generate this exam again with questions.</p>
            <button onclick="window.close()">Close</button>
          </body>
          </html>
        `);
        examWindow.document.close();
        return;
      }
      
      // Parse questions and handle errors
      let parsedQuestions: ParsedQuestionItem[] = [];
      try {
        parsedQuestions = parseQuestions(exam.questions);
        console.log("Parsed questions:", parsedQuestions);
      } catch (parseError) {
        console.error("Error parsing questions:", parseError);
        
        toast({
          title: "Error Parsing Questions",
          description: "There was a problem with the exam questions format.",
          variant: "destructive"
        });
        
        examWindow.document.open();
        examWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${exam.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .error { color: #e53e3e; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${exam.name}</h1>
            <p class="error">There was a problem with the exam questions format.</p>
            <p>Please go back and try generating this exam again.</p>
            <pre class="text-left text-xs mt-4">${parseError instanceof Error ? parseError.message : 'Unknown error'}</pre>
            <button onclick="window.close()">Close</button>
          </body>
          </html>
        `);
        examWindow.document.close();
        return;
      }
      
      if (parsedQuestions.length === 0) {
        console.warn("No questions found or unable to parse questions");
        
        toast({
          title: "No Questions Found",
          description: "The exam was generated but no questions were found.",
          variant: "destructive"
        });
        
        // Generate a basic HTML with a message if no questions
        const errorHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${exam.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .error { color: #e53e3e; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>${exam.name}</h1>
            <p class="error">This exam has no questions or the questions couldn't be loaded.</p>
            <p>If you generated this exam recently, please go back and check if the exam generation was successful.</p>
            <button onclick="window.close()">Close</button>
          </body>
          </html>
        `;
        examWindow.document.open();
        examWindow.document.write(errorHtml);
        examWindow.document.close();
        return;
      }
      
      // Generate HTML content for exam with questions
      const examContent = generateExamHtml(exam, parsedQuestions);
      
      // Write the content to the new window
      examWindow.document.open();
      examWindow.document.write(examContent);
      examWindow.document.close();
    } catch (error) {
      console.error("Error rendering exam:", error);
      // Show error in the exam window
      examWindow.document.open();
      examWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            .error { color: #e53e3e; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Error Rendering Exam</h1>
          <p class="error">There was a problem loading this exam. Please try again or contact support.</p>
          <pre>${error instanceof Error ? error.message : 'Unknown error'}</pre>
          <button onclick="window.close()">Close</button>
        </body>
        </html>
      `);
      examWindow.document.close();
      
      // Also show a toast
      toast({
        title: "Error Loading Exam",
        description: "There was a problem loading this exam. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Return an object with the function instead of rendering a component
  return {
    handleViewExam,
  };
};

export { parseQuestions };
export default ExamRendererWithHandwritten;
