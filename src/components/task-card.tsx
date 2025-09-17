import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Calendar, Target, AlertCircle, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    duration: number;
    priority: "critical" | "high" | "medium" | "low";
    type: "fixed" | "flexible" | "incomplete";
    targets?: string[];
    completed?: boolean;
    progress?: number;
  };
  onComplete?: (taskId: string, completed: boolean) => void;
  onEdit?: (task: any) => void;
  onReschedule?: (task: any) => void;
  className?: string;
}

export function TaskCard({ task, onComplete, onEdit, onReschedule, className }: TaskCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "text-destructive border-destructive";
      case "high": return "text-warning border-warning";
      case "medium": return "text-primary border-primary";
      case "low": return "text-accent border-accent";
      default: return "text-muted-foreground border-border";
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "fixed": return "task-fixed";
      case "flexible": return "task-flexible";
      case "incomplete": return "task-incomplete";
      default: return "";
    }
  };

  return (
    <Card className={cn(
      "p-4 hover:shadow-md transition-all duration-300 border-l-4",
      `task-priority-${task.priority}`,
      getTypeStyles(task.type),
      task.completed && "opacity-60",
      className
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Checkbox
            checked={task.completed}
            onCheckedChange={(checked) => onComplete?.(task.id, checked as boolean)}
            className="mt-0.5"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={cn(
                "font-medium leading-none",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.name}
              </h3>
              <Badge variant={task.type === "fixed" ? "default" : "secondary"} className="text-xs">
                {task.type}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{task.startTime} - {task.endTime}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{task.duration}min</span>
              </div>
              {task.priority === "critical" && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>Critical</span>
                </div>
              )}
            </div>

            {task.targets && task.targets.length > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-3 w-3 text-muted-foreground" />
                <div className="flex gap-1">
                  {task.targets.map((target, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {target}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {task.progress !== undefined && task.progress < 100 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{task.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {(onEdit || onReschedule) && (
          <div className="flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                className="shrink-0"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}
            {onReschedule && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReschedule(task)}
                className="shrink-0"
              >
                <Calendar className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}