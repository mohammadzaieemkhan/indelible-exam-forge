
import React from "react";
import { ParsedQuestionItem, parseQuestions, markdownToHtml } from "@/components/exam/utils/examParser";
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
    // Check if the exam is available based on scheduled date and time
    const now = new Date();
    const examDate = new Date(`${exam.date}T${exam.time || '00:00'}`);
    
    if (!exam.isActive || now < examDate) {
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
        console.log("About to parse questions:", typeof exam.questions, exam.questions);
        
        // Ensure questions is a string when parsing
        const questionsText = typeof exam.questions === 'string' 
          ? exam.questions 
          : JSON.stringify(exam.questions);
        
        parsedQuestions = parseQuestions(questionsText);
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
              .raw-content { white-space: pre-wrap; text-align: left; padding: 15px; 
                          background-color: #f7f7f7; border-radius: 5px; margin: 20px auto; 
                          max-width: 90%; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>${exam.name}</h1>
            <p class="error">There was a problem with the exam questions format.</p>
            <p>Here is the raw content that couldn't be parsed:</p>
            <div class="raw-content">${markdownToHtml(typeof exam.questions === 'string' 
              ? exam.questions 
              : JSON.stringify(exam.questions, null, 2))}</div>
            <p>Please go back and try generating this exam again.</p>
            <button onclick="window.close()">Close</button>
          </body>
          </html>
        `);
        examWindow.document.close();
        return;
      }
      
      if (parsedQuestions.length === 0) {
        console.warn("No questions found or unable to parse questions");
        
        // Try to display the raw text if parsing failed
        const examHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${exam.name}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { text-align: center; margin-bottom: 20px; }
              .question { margin-bottom: 20px; padding: 10px; border: 1px solid #eee; border-radius: 5px; }
              .raw-content { white-space: pre-wrap; margin-top: 20px; padding: 15px; background-color: #f7f7f7; border-radius: 5px; }
            </style>
          </head>
          <body>
            <h1>${exam.name}</h1>
            <div class="question">
              <p><strong>Warning:</strong> The system couldn't parse the questions automatically. Here is the raw content:</p>
              <div class="raw-content">${markdownToHtml(typeof exam.questions === 'string' 
                ? exam.questions 
                : JSON.stringify(exam.questions, null, 2))}</div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <button onclick="window.close()">Close Exam</button>
            </div>
          </body>
          </html>
        `;
        
        examWindow.document.open();
        examWindow.document.write(examHtml);
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

export default ExamRendererWithHandwritten;
