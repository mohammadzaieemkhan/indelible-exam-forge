
import ExamTabs from "@/components/ExamTabs";
import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Bell, Sparkles, Brain } from "lucide-react";
import { motion } from "framer-motion";

const DashboardPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto py-6 md:py-8 px-4 md:px-6 space-y-6 md:space-y-10"
    >
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gradient">Exam Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">Create, manage and track performance on your exams</p>
        </div>
        
        {/* Quick stats cards */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 w-full md:w-auto"
        >
          <motion.div variants={itemVariants}>
            <Card className="p-3 md:p-4 flex items-center gap-2 md:gap-3 glass-card hover-scale">
              <div className="bg-primary/10 p-2 rounded-full text-primary animate-pulse-glow">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium">Create Exams</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Based on your syllabus</p>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-3 md:p-4 flex items-center gap-2 md:gap-3 glass-card hover-scale">
              <div className="bg-primary/10 p-2 rounded-full text-primary animate-pulse-glow">
                <Calendar className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium">Schedule Tests</p>
                <p className="text-xs text-muted-foreground hidden sm:block">Set dates and times</p>
              </div>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="p-3 md:p-4 flex items-center gap-2 md:gap-3 glass-card hover-scale">
              <div className="bg-primary/10 p-2 rounded-full text-primary animate-pulse-glow">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium">Get Notified</p>
                <p className="text-xs text-muted-foreground hidden sm:block">WhatsApp reminders</p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl blur opacity-30"></div>
        <div className="relative bg-background/80 backdrop-blur-sm rounded-lg border border-border p-1">
          <ExamTabs />
        </div>
      </motion.div>

      {/* Decorative elements */}
      <div className="fixed top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
    </motion.div>
  );
};

export default DashboardPage;
