
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Shield, Database, Award, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="container mx-auto py-8 px-4 space-y-12 animate-fade-in">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl font-bold">About Indelible AI</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          We're transforming the way educators create, manage, and analyze exams through
          the power of artificial intelligence and thoughtful design.
        </p>
      </section>
      
      {/* Mission Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="text-lg text-muted-foreground">
            Indelible AI was founded with a simple but powerful mission: to give educators back their time
            while improving the quality of assessments. We believe that by automating the repetitive aspects
            of exam creation, teachers can focus more on what matters—teaching.
          </p>
          <p className="text-lg text-muted-foreground">
            Our platform combines cutting-edge AI with education expertise to generate high-quality,
            customized exams tailored to your syllabus and learning objectives.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-64 h-64 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-24 w-24 text-primary" />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover-scale">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Smart Exam Generation</h3>
              <p className="text-muted-foreground">
                Create custom exams in seconds by uploading your syllabus or selecting topics.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Performance Analytics</h3>
              <p className="text-muted-foreground">
                Track student progress with detailed metrics and visual reports.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Database className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Exam Repository</h3>
              <p className="text-muted-foreground">
                Store and organize all your exams in one centralized location.
              </p>
            </CardContent>
          </Card>
          <Card className="hover-scale">
            <CardContent className="p-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Data Security</h3>
              <p className="text-muted-foreground">
                Enterprise-grade encryption and GDPR-compliant data handling.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* Team Section */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-center">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-muted mx-auto"></div>
              <div>
                <h3 className="text-xl font-semibold">Dr. Sarah Chen</h3>
                <p className="text-muted-foreground">Founder & CEO</p>
              </div>
              <p className="text-muted-foreground">
                Former professor with 15+ years in educational technology and assessment design.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-muted mx-auto"></div>
              <div>
                <h3 className="text-xl font-semibold">Mark Johnson</h3>
                <p className="text-muted-foreground">CTO</p>
              </div>
              <p className="text-muted-foreground">
                AI researcher specializing in natural language processing and educational applications.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-muted mx-auto"></div>
              <div>
                <h3 className="text-xl font-semibold">Elena Rodriguez</h3>
                <p className="text-muted-foreground">Head of Education</p>
              </div>
              <p className="text-muted-foreground">
                Curriculum development expert with a background in assessment methodologies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-muted/40 rounded-lg p-8 text-center space-y-4">
        <h2 className="text-3xl font-bold">Ready to Transform Your Exam Process?</h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Join thousands of educators who are saving time and improving assessment quality with Indelible AI.
        </p>
        <div className="pt-4">
          <Link to="/login">
            <Button size="lg">Get Started Today</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
