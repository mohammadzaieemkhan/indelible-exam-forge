
import { Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IExam } from "@/components/ExamTabs";

interface PreviousExamsTabProps {
  exams: IExam[];
}

const PreviousExamsTab = ({ exams }: PreviousExamsTabProps) => {
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
                <th className="p-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length > 0 ? exams.map((exam, index) => (
                <tr key={index} className="border-b hover:bg-muted/20">
                  <td className="p-2">{exam.name}</td>
                  <td className="p-2">{exam.date}</td>
                  <td className="p-2">
                    {exam.topics.map((topic, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full mr-1">
                        {topic}
                      </span>
                    ))}
                  </td>
                  <td className="p-2">{exam.difficulty}</td>
                  <td className="p-2">
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No previous exams found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreviousExamsTab;
