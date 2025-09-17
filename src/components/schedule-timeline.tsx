import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: "fixed" | "flexible" | "incomplete" | "break";
  priority: "critical" | "high" | "medium" | "low";
  completed?: boolean;
}

interface ScheduleTimelineProps {
  date: string;
  tasks: TimeSlot[];
  className?: string;
  onTaskClick?: (taskId: string) => void;
}

export function ScheduleTimeline({ date, tasks, className, onTaskClick }: ScheduleTimelineProps) {
  const formatTime = (time: string) => {
    return new Date(`2024-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTaskColor = (type: string, priority: string) => {
    if (type === "break") return "bg-muted/50 border-muted";
    
    const baseColors = {
      fixed: "bg-primary/10 border-primary/20 hover:bg-primary/15",
      flexible: "bg-accent/10 border-accent/20 hover:bg-accent/15", 
      incomplete: "bg-warning/10 border-warning/20 hover:bg-warning/15"
    };
    
    return baseColors[type as keyof typeof baseColors] || "bg-muted/10 border-border";
  };

  const currentTime = new Date().toTimeString().slice(0, 5);
  
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Today's Schedule</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {new Date(date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current time</p>
          <p className="text-lg font-mono font-semibold">{formatTime(currentTime)}</p>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            onClick={() => onTaskClick?.(task.id)}
            className={cn(
              "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200",
              getTaskColor(task.type, task.priority),
              task.completed && "opacity-50 grayscale",
              "hover:shadow-md"
            )}
          >
            {/* Time indicator line */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent rounded-l" />
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={cn(
                    "font-medium text-sm",
                    task.completed && "line-through"
                  )}>
                    {task.name}
                  </h3>
                  <Badge 
                    variant={task.type === "fixed" ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {task.type}
                  </Badge>
                  {task.priority === "critical" && (
                    <Badge variant="destructive" className="text-xs">
                      Critical
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono">
                      {formatTime(task.startTime)} - {formatTime(task.endTime)}
                    </span>
                  </div>
                  <span>{task.duration} minutes</span>
                </div>
              </div>

              {task.completed && (
                <div className="text-success text-xs font-medium">
                  ✓ Completed
                </div>
              )}
            </div>

            {/* Progress indicator for current task */}
            {!task.completed && task.startTime <= currentTime && task.endTime >= currentTime && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-primary font-medium">In Progress</span>
                  <span className="text-muted-foreground">Active now</span>
                </div>
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse-glow" style={{ width: "60%" }} />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tasks scheduled for today</p>
            <p className="text-sm">Ask the AI agent to generate your schedule!</p>
          </div>
        )}
      </div>
    </Card>
  );
}