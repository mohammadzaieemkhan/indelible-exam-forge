
import ExamTabs from "@/components/ExamTabs";

const DashboardPage = () => {
  return (
    <div className="container mx-auto py-6 px-4 md:px-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your exams and track performance</p>
        </div>
      </div>
      
      <ExamTabs />
    </div>
  );
};

export default DashboardPage;
