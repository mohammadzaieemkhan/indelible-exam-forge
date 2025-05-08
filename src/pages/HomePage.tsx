
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, BookCheck, BarChart, Clock, FileCheck } from "lucide-react";

const HomePage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Create Perfect Exams with{" "}
                <span className="text-primary">Indelible AI</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Smart exam generation powered by AI. Create, track, and analyze student performance with unmatched ease.
              </p>
            </div>
            <div className="space-x-4">
              <Link to="/login">
                <Button size="lg" className="animate-pulse">Get Started</Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline">Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform provides comprehensive tools to streamline your exam creation and performance tracking.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <BookOpen className="h-8 w-8 text-primary" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Smart Exam Generation</h3>
                  <p className="text-muted-foreground">
                    Upload your syllabus and let our AI create perfectly tailored exams in seconds.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <BarChart className="h-8 w-8 text-primary" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Performance Tracking</h3>
                  <p className="text-muted-foreground">
                    Analyze student performance with detailed metrics and visualizations.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <Clock className="h-8 w-8 text-primary" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Exam Scheduling</h3>
                  <p className="text-muted-foreground">
                    Schedule and manage upcoming exams with Google Calendar integration.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <FileCheck className="h-8 w-8 text-primary" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Previous Exams</h3>
                  <p className="text-muted-foreground">
                    Access and export all your historical exam data for reference and reporting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-t">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Ready to Transform Your Exam Process?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                Join thousands of educators using Indelible AI to create better exams and track student progress.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-2">
              <Link to="/login" className="w-full">
                <Button size="lg" className="w-full">Get Started for Free</Button>
              </Link>
              <p className="text-xs text-muted-foreground">
                No credit card required. Start with our free plan today.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
