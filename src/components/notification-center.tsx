import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, CheckCircle, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "task_start" | "task_end" | "reminder" | "schedule_update" | "system";
  title: string;
  message: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
  taskId?: string;
  read?: boolean;
  actions?: {
    label: string;
    action: () => void;
    variant?: "default" | "destructive" | "outline";
  }[];
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onDismiss?: (notificationId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

export function NotificationCenter({ 
  notifications, 
  onMarkAsRead, 
  onDismiss, 
  onClearAll,
  className 
}: NotificationCenterProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_start": return <Clock className="h-4 w-4 text-primary" />;
      case "task_end": return <CheckCircle className="h-4 w-4 text-success" />;
      case "reminder": return <Bell className="h-4 w-4 text-warning" />;
      case "schedule_update": return <AlertTriangle className="h-4 w-4 text-accent" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-destructive bg-destructive/5";
      case "medium": return "border-l-warning bg-warning/5";
      case "low": return "border-l-accent bg-accent/5";
      default: return "border-l-border";
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        {notifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "relative p-4 rounded-lg border-l-4 bg-card transition-all duration-200 hover:shadow-sm",
              getPriorityColor(notification.priority),
              !notification.read && "ring-2 ring-primary/20",
              notification.read && "opacity-75"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                {getNotificationIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm leading-none">
                      {notification.title}
                    </h4>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTime(notification.timestamp)}</span>
                    <Badge variant="outline" className="text-xs">
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>

                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {notification.actions.map((action, index) => (
                        <Button
                          key={index}
                          variant={action.variant || "outline"}
                          size="sm"
                          onClick={action.action}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead?.(notification.id)}
                    className="h-6 w-6 p-0"
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss?.(notification.id)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        {notifications.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )}
      </div>
    </Card>
  );
}