
import ExamTabs from "@/components/ExamTabs";
import { Card } from "@/components/ui/card";
import { Calendar, BookOpen, Bell, Award } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardPage = () => {
  const isMobile = useIsMobile();
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const quickStats = [
    { 
      icon: BookOpen, 
      title: "Create Exams", 
      description: "Based on your syllabus",
      className: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
    },
    { 
      icon: Calendar, 
      title: "Schedule Tests", 
      description: "Set dates and times",
      className: "bg-gradient-to-br from-purple-500/20 to-pink-500/20"
    },
    { 
      icon: Bell, 
      title: "Get Notified", 
      description: "WhatsApp reminders",
      className: "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
    },
    { 
      icon: Award, 
      title: "Track Progress", 
      description: "See your improvement",
      className: "bg-gradient-to-br from-emerald-500/20 to-green-500/20"
    }
  ];

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto py-4 sm:py-6 md:py-10 px-3 sm:px-4 md:px-6 space-y-4 sm:space-y-6 md:space-y-12"
    >
      <motion.div 
        variants={itemVariants} 
        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6"
      >
        <div className="space-y-1 sm:space-y-2 w-full md:w-auto">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Exam Dashboard
          </h1>
          <p className="text-xs sm:text-sm md:text-lg text-muted-foreground">
            Create, manage and track performance on your exams
          </p>
        </div>
        
        {/* Quick stats cards */}
        <motion.div 
          variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 w-full md:w-auto"
        >
          {quickStats.map((stat, i) => (
            <motion.div 
              key={i}
              variants={itemVariants} 
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Card className={cn("p-2 sm:p-3 md:p-4 flex items-center gap-1 sm:gap-2 md:gap-3 border border-primary/10 overflow-hidden relative", stat.className)}>
                <div className="absolute top-0 left-0 w-full h-full opacity-50 bg-glass-gradient backdrop-blur-sm -z-10" />
                <div className="bg-primary/10 p-1.5 sm:p-2 rounded-full text-primary">
                  <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium">{stat.title}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{stat.description}</p>
                </div>
                <motion.div 
                  className="absolute -bottom-4 -right-4 w-12 sm:w-16 h-12 sm:h-16 bg-primary/5 rounded-full -z-10"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{ 
                    duration: 3, 
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      
      <motion.div 
        variants={itemVariants}
        className="relative"
      >
        <motion.div 
          className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 rounded-xl blur opacity-30"
          animate={{ 
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.02, 1]
          }}
          transition={{ 
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity
          }}
        />
        <div className="relative bg-background/80 backdrop-blur-sm rounded-lg border border-border shadow-md p-0 sm:p-1 overflow-x-auto">
          <ExamTabs />
        </div>
      </motion.div>

      {/* Decorative elements - conditionally render based on screen size */}
      {!isMobile && (
        <>
          <motion.div 
            className="fixed top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10"
            animate={{ 
              opacity: [0.5, 0.3, 0.5],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 10,
              ease: "easeInOut",
              repeat: Infinity
            }}
          />
          <motion.div 
            className="fixed bottom-20 left-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-10"
            animate={{ 
              opacity: [0.5, 0.3, 0.5],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 12,
              ease: "easeInOut",
              repeat: Infinity,
              delay: 2
            }}
          />
        </>
      )}
    </motion.div>
  );
};

export default DashboardPage;
