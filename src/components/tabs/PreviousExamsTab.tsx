
import { useState, useMemo } from "react";
import { Filter, Eye, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IExam } from "@/components/ExamTabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import DeleteExamDialog from "@/components/exam/DeleteExamDialog";

interface PreviousExamsTabProps {
  exams: IExam[];
  onDeleteExam?: (examId: string) => void; 
}

const PreviousExamsTab = ({ exams, onDeleteExam }: PreviousExamsTabProps) => {
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [filterDate, setFilterDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [examToDelete, setExamToDelete] = useState<IExam | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { toast } = useToast();
  
  // Extract unique subjects from all exams
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    exams.forEach(exam => {
      exam.topics.forEach(topic => subjects.add(topic));
    });
    return Array.from(subjects);
  }, [exams]);
  
  // Extract unique dates from all exams
  const uniqueDates = useMemo(() => {
    const dates = new Set<string>();
    exams.forEach(exam => {
      dates.add(exam.date);
    });
    return Array.from(dates).sort();
  }, [exams]);
  
  // Filter exams based on subject and date
  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesSubject = filterSubject === "" || filterSubject === "all-subjects" || exam.topics.includes(filterSubject);
      const matchesDate = filterDate === "" || filterDate === "all-dates" || exam.date === filterDate;
      return matchesSubject && matchesDate;
    });
  }, [exams, filterSubject, filterDate]);
  
  // Reset filters
  const handleResetFilters = () => {
    setFilterSubject("");
    setFilterDate("");
  };
  
  // Open dialog to view exam details
  const handleViewExam = (exam: IExam) => {
    setSelectedExam(exam);
    setViewDialogOpen(true);
  };
  
  // Handle delete button click
  const handleDelete = (examId: string) => {
    // Find the exam to delete
    const exam = exams.find(e => e.id === examId);
    if (exam) {
      setExamToDelete(exam);
      setDeleteConfirmOpen(true);
    }
  };
  
  // Handle confirmed deletion
  const handleConfirmDelete = () => {
    if (examToDelete && examToDelete.id && onDeleteExam) {
      onDeleteExam(examToDelete.id);
      toast({
        title: "Exam Deleted",
        description: `${examToDelete.name} has been deleted successfully.`
      });
    }
    setDeleteConfirmOpen(false);
    setExamToDelete(null);
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
  
  // Generate and download report card for an exam
  const handleDownloadReport = (examId: string) => {
    // Find the exam result for this exam
    try {
      const savedResults = localStorage.getItem('examResults');
      if (savedResults) {
        const results = JSON.parse(savedResults);
        const result = results.find((r: any) => r.examId === examId);
        if (result) {
          // Generate HTML report
          const reportHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Exam Report - ${result.examName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #2563eb; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background-color: #f8f9fa; }
                .score { font-size: 24px; font-weight: bold; }
                .topics { display: flex; flex-wrap: wrap; gap: 10px; }
                .topic { background: #e2e8f0; padding: 5px 10px; border-radius: 15px; font-size: 14px; }
                .progress-container { width: 100%; background-color: #e0e0e0; border-radius: 5px; }
                .progress-bar { height: 20px; background-color: #2563eb; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Exam Report</h1>
                <p>${result.examName} - ${result.date}</p>
              </div>
              
              <div class="section">
                <h2>Score Summary</h2>
                <p class="score">${result.percentage}% (${result.score}/${result.totalMarks})</p>
                <div class="progress-container">
                  <div class="progress-bar" style="width: ${result.percentage}%"></div>
                </div>
                <p>Time taken: ${result.timeTaken}</p>
              </div>
              
              <div class="section">
                <h2>Question Statistics</h2>
                <p>Correct: ${result.questionStats.correct} | Incorrect: ${result.questionStats.incorrect} | Unattempted: ${result.questionStats.unattempted}</p>
              </div>
              
              <div class="section">
                <h2>Topic Performance</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(result.topicPerformance).map(([topic, percentage]) => `
                      <tr>
                        <td>${topic}</td>
                        <td>
                          <div class="progress-container">
                            <div class="progress-bar" style="width: ${percentage}%"></div>
                          </div>
                          ${percentage}%
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              
              <div class="section">
                <h2>Question Details</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Type</th>
                      <th>Marks</th>
                      <th>Your Answer</th>
                      <th>Correct Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${result.questionDetails.map((q: any, i: number) => `
                      <tr>
                        <td>${q.question.length > 40 ? q.question.substring(0, 40) + '...' : q.question}</td>
                        <td>${q.type}</td>
                        <td>${q.marksObtained}/${q.totalMarks}</td>
                        <td>${q.userAnswer || 'Not attempted'}</td>
                        <td>${q.correctAnswer || 'N/A'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </body>
            </html>
          `;
          
          // Create blob and download
          const blob = new Blob([reportHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${result.examName.replace(/\s+/g, '-')}-Report.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Previous Exams</CardTitle>
          <CardDescription>View and manage your past exams</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" /> Filter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="flex flex-wrap gap-3 mb-4 p-4 bg-muted/20 rounded-md">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Select value={filterSubject} onValueChange={setFilterSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-subjects">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">Date</label>
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-dates">All Dates</SelectItem>
                  {uniqueDates.map(date => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(filterSubject || filterDate) && (
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}
        
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
              {filteredExams.length > 0 ? filteredExams.map((exam, index) => {
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
                    <td className="p-2 flex gap-2 items-center">
                      <Button variant="ghost" size="sm" onClick={() => handleViewExam(exam)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      {examScore && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReport(exam.id || '')}>
                          Report
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(exam.id || '')}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-1">Delete</span>
                      </Button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    No previous exams found{filterSubject || filterDate ? ' matching your filter criteria' : ''}.
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

      {/* Delete confirmation dialog */}
      <DeleteExamDialog 
        open={deleteConfirmOpen}
        examToDelete={examToDelete}
        onOpenChange={setDeleteConfirmOpen}
        onConfirmDelete={handleConfirmDelete}
      />
    </Card>
  );
};

export default PreviousExamsTab;
