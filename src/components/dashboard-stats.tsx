import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Target, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Zap 
} from "lucide-react";

interface DashboardStatsProps {
  stats: {
    todayProgress: number;
    completedTasks: number;
    totalTasks: number;
    weeklyGoalProgress: number;
    focusTime: number;
    efficiency: number;
  };
  className?: string;
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  const progressPercentage = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {/* Today's Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{progressPercentage}%</div>
          <Progress value={progressPercentage} className="mb-2" />
          <p className="text-xs text-muted-foreground">
            {stats.completedTasks} of {stats.totalTasks} tasks completed
          </p>
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Goals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{stats.weeklyGoalProgress}%</div>
          <Progress value={stats.weeklyGoalProgress} className="mb-2" />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">On track</p>
            <Badge variant="secondary" className="text-xs">
              {stats.weeklyGoalProgress >= 80 ? "Excellent" : stats.weeklyGoalProgress >= 60 ? "Good" : "Behind"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Focus Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Focus Time Today</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">
            {Math.floor(stats.focusTime / 60)}h {stats.focusTime % 60}m
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-success">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+12% vs yesterday</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Efficiency Score */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold mb-2">{stats.efficiency}/100</div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Task completion rate</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Schedule adherence</span>
              <span className="font-medium">89%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Completion */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold">{stats.completedTasks}</span>
            <span className="text-sm text-muted-foreground">/ {stats.totalTasks} tasks</span>
          </div>
          <div className="flex gap-2">
            <Badge variant="default" className="text-xs">
              {stats.completedTasks} Completed
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.totalTasks - stats.completedTasks} Remaining
            </Badge>
            {stats.totalTasks - stats.completedTasks > 0 && (
              <Badge variant="outline" className="text-xs">
                Next: Study Session
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}