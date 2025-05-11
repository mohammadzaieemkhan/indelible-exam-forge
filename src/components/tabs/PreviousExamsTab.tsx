
import { useState } from "react";
import { Filter, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IExam } from "@/components/ExamTabs";

interface PreviousExamsTabProps {
  exams: IExam[];
}

const PreviousExamsTab = ({ exams }: PreviousExamsTabProps) => {
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  
  // Open dialog to view exam details
  const handleViewExam = (exam: IExam) => {
    setSelectedExam(exam);
    setViewDialogOpen(true);
  };
  
  // Simple function to convert markdown to HTML for preview
  const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    
    // Basic markdown parsing - replace markdown syntax with HTML
    let html = markdown
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      
      // Emphasis (bold and italic)
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/_(.*?)_/gim, '<em>$1</em>')
      
      // Lists - Unordered
      .replace(/^\s*[-*+]\s+(.*$)/gim, '<ul><li>$1</li></ul>')
      // Lists - Ordered
      .replace(/^\s*(\d+)\.\s+(.*$)/gim, '<ol><li>$2</li></ol>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" target="_blank">$1</a>')
      
      // Code blocks
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      
      // Paragraphs
      .replace(/^\s*(\n)?(.+)/gim, function(m) {
        return /^\s*(<(\/)?(h|ul|ol|li|blockquote|pre|p))/i.test(m) ? m : '<p>' + m + '</p>';
      })
      
      // Line breaks
      .replace(/\n/gim, '<br />');
    
    // Fix duplicate tags caused by multi-line regex
    html = html.replace(/<\/ul>\s*<ul>/gim, '')
               .replace(/<\/ol>\s*<ol>/gim, '')
               .replace(/<\/p>\s*<p>/gim, '<br />');
    
    return html;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Previous Exams</CardTitle>
          <CardDescription>View and export your past exams</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-2 text-left font-medium">Exam Name</th>
                <th className="p-2 text-left font-medium">Date</th>
                <th className="p-2 text-left font-medium">Topics</th>
                <th className="p-2 text-left font-medium">Difficulty</th>
                <th className="p-2 text-left font-medium">Score</th>
                <th className="p-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? exams.map((exam, index) => {
                // Try to find the exam result for this exam
                let examScore = "";
                let examScorePercentage = "";
                try {
                  const savedResults = localStorage.getItem('examResults');
                  if (savedResults) {
                    const results = JSON.parse(savedResults);
                    const result = results.find((r: any) => r.examId === exam.id);
                    if (result) {
                      examScore = `${result.score}/${result.totalMarks}`;
                      examScorePercentage = `(${result.percentage}%)`;
                    }
                  }
                } catch (error) {
                  console.error("Error finding exam result:", error);
                }
                
                return (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    <td className="p-2">{exam.name}</td>
                    <td className="p-2">{exam.date}</td>
                    <td className="p-2">
                      {exam.topics.slice(0, 2).map((topic, i) => (
                        <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full mr-1">
                          {topic}
                        </span>
                      ))}
                      {exam.topics.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{exam.topics.length - 2} more
                        </span>
                      )}
                    </td>
                    <td className="p-2">{exam.difficulty}</td>
                    <td className="p-2">
                      {examScore ? (
                        <span>
                          {examScore} <span className="text-xs text-muted-foreground">{examScorePercentage}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">No result</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewExam(exam)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No previous exams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* View Exam Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedExam?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {selectedExam?.questions ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {selectedExam.topics.map((topic, i) => (
                    <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                      {topic}
                    </span>
                  ))}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Questions</h3>
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(selectedExam.questions) }} />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p>Date: {selectedExam.date}</p>
                  <p>Duration: {selectedExam.duration} minutes</p>
                  <p>Difficulty: {selectedExam.difficulty}</p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Question content not available.
              </p>
            )}
            
            <div className="pt-4">
              <Button variant="outline" className="w-full" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PreviousExamsTab;
