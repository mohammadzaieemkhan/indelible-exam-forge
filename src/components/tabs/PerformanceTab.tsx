
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart } from "lucide-react";

const PerformanceTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Tracking</CardTitle>
        <CardDescription>Analyze student performance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Score History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/40">
                <div className="text-center text-muted-foreground">
                  <LineChart className="h-10 w-10 mx-auto mb-2" />
                  <p>Line Chart Visualization</p>
                  <p className="text-sm">(Connect to Chart.js)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Topic Mastery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center border rounded-lg bg-muted/40">
                <div className="text-center text-muted-foreground">
                  <BarChart className="h-10 w-10 mx-auto mb-2" />
                  <p>Radial Progress Visualization</p>
                  <p className="text-sm">(Connect to Chart.js)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTab;
