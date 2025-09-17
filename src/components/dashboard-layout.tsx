import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Bot, 
  Bell, 
  Settings, 
  Target,
  BarChart3,
  RefreshCw,
  Moon,
  Sun,
  Plus,
  Edit3,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { TaskCard } from "./task-card";
import { ScheduleTimeline } from "./schedule-timeline";
import { NotificationCenter } from "./notification-center";
import { AiChatInterface } from "./ai-chat-interface";
import { DashboardStats } from "./dashboard-stats";
import { TaskFormModal } from "./task-form-modal";
import { cn } from "@/lib/utils";
import { googleSheetsService, PriorityTask, CourseScheduleItem, IncompleteTask } from "@/services/google-sheets";
import { geminiService } from "@/services/gemini-ai";
import { googleCalendarService, ScheduleCandidate } from "@/services/google-calendar";
import { notificationService, NotificationConfig, TaskCompletionData } from "@/services/notification-service";

// Task type definition
export interface Task {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  priority: "critical" | "high" | "medium" | "low";
  type: "fixed" | "flexible" | "incomplete";
  targets: string[];
  completed: boolean;
  progress?: number;
}

// Sample data - in real app, this would come from APIs
const sampleTasks: Task[] = [
  {
    id: "1",
    name: "Math Class - Differential Equations",
    startTime: "09:00",
    endTime: "10:30",
    duration: 90,
    priority: "critical",
    type: "fixed",
    targets: ["attend_class", "academic_progress"],
    completed: true
  },
  {
    id: "2",
    name: "Gym Workout - Upper Body",
    startTime: "11:00", 
    endTime: "12:00",
    duration: 60,
    priority: "high",
    type: "flexible",
    targets: ["fitness", "health"],
    completed: false,
    progress: 0
  },
  {
    id: "3",
    name: "Study: Algorithms & Data Structures",
    startTime: "13:00",
    endTime: "15:00", 
    duration: 120,
    priority: "high",
    type: "flexible",
    targets: ["exam_prep", "skills_development"],
    completed: false,
    progress: 45
  },
  {
    id: "4",
    name: "Complete React Project",
    startTime: "15:30",
    endTime: "17:00",
    duration: 90,
    priority: "medium",
    type: "incomplete",
    targets: ["portfolio", "skills_development"], 
    completed: false,
    progress: 70
  },
  {
    id: "5",
    name: "Math",
    startTime: "06:30",
    endTime: "07:30",
    duration: 60,
    priority: "medium",
    type: "flexible",
    targets: ["study", "preparation"], 
    completed: false,
    progress: 0
  }
];

// Define notification type to match the state interface
interface NotificationItem {
  id: string;
  type: "task_start" | "task_end" | "reminder" | "schedule_update" | "system";
  title: string; 
  message: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
  read: boolean;
  actions?: { label: string; action: () => void; }[];
}

const sampleNotifications: NotificationItem[] = [
  {
    id: `sample_start_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: "task_start" as const,
    title: "Math Class Starting",
    message: "Your differential equations class starts in 5 minutes",
    timestamp: new Date().toISOString(),
    priority: "high" as const,
    read: false,
    actions: [
      { label: "Join Class", action: () => console.log("Joining class") },
      { label: "Snooze 5min", action: () => console.log("Snoozing") }
    ]
  },
  {
    id: `sample_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
    type: "schedule_update" as const,
    title: "Schedule Optimized",
    message: "Your schedule has been updated to accommodate the new gym session",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    priority: "medium" as const,
    read: true
  }
];

const sampleMessages = [
  {
    id: "1",
    type: "system" as const,
    content: "Welcome! I've analyzed your Google Sheets and created an optimized schedule for today. You have 5 tasks scheduled with 85% goal alignment.",
    timestamp: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: "2",
    type: "user" as const,
    content: "Can you move my gym session to 6pm instead?",
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: "3",
    type: "agent" as const,
    content: "I can reschedule your gym session to 6pm. This will move your React project work to tomorrow morning. Would you like me to apply these changes?",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    actions: [
      { label: "Apply Changes", action: () => console.log("Applying changes") },
      { label: "Show Alternatives", action: () => console.log("Showing alternatives") }
    ]
  }
];

interface DashboardLayoutProps {
  className?: string;
}

export function DashboardLayout({ className }: DashboardLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState(sampleTasks);
  const [notifications, setNotifications] = useState<NotificationItem[]>(sampleNotifications);
  const [messages, setMessages] = useState(sampleMessages);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [courseSchedule, setCourseSchedule] = useState<CourseScheduleItem[]>([]);
  const [priorityTasks, setPriorityTasks] = useState<PriorityTask[]>([]);
  const [incompleteTasks, setIncompleteTasks] = useState<IncompleteTask[]>([]);
  const [scheduleCandidates, setScheduleCandidates] = useState<ScheduleCandidate[]>([]);
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const { toast } = useToast();

  const stats = {
    todayProgress: Math.round((tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)) * 100),
    completedTasks: tasks.filter(t => t.completed).length,
    totalTasks: tasks.length,
    weeklyGoalProgress: 78,
    focusTime: tasks.reduce((acc, task) => acc + (task.completed ? task.duration : 0), 0),
    efficiency: tasks.length > 0 ? Math.round(
      (tasks.filter(t => t.completed).length / tasks.length) * 100 * 
      (tasks.reduce((acc, task) => acc + (task.progress || 0), 0) / (tasks.length * 100))
    ) : 0,
    priorityScore: Math.round(
      tasks.reduce((acc, task) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }[task.priority];
        return acc + (task.completed ? priorityWeight * 25 : 0);
      }, 0) / Math.max(tasks.length, 1)
    )
  };

  useEffect(() => {
    // Load saved tasks from localStorage on component mount
    loadLocalTasks();
    
    // Initialize notification service
    initializeNotifications();
    
    // Load data from Google Sheets
    loadSheetsData();
  }, []);

  const initializeNotifications = async () => {
    // Request notification permissions
    await notificationService.requestPermissions();
    
    // Subscribe to notifications
    const unsubscribe = notificationService.subscribe((notification) => {
      handleNotification(notification);
    });

    // Schedule notifications for current tasks
    tasks.forEach(task => {
      if (!task.completed) {
        const today = new Date().toISOString().split('T')[0];
        const startDateTime = `${today}T${task.startTime}:00`;
        const endDateTime = `${today}T${task.endTime}:00`;
        
        notificationService.scheduleTaskStartNotification(task.id, task.name, startDateTime);
        notificationService.scheduleTaskEndNotification(task.id, task.name, endDateTime);
      }
    });

    return unsubscribe;
  };

  const handleNotification = (notification: NotificationConfig) => {
    // Add to notifications list  
    const newNotification: NotificationItem = {
      id: notification.id,
      type: notification.type as NotificationItem['type'],
      title: notification.title,
      message: notification.message,
      timestamp: notification.scheduledTime,
      priority: (notification.type === 'task_start' ? 'high' : 'medium') as NotificationItem['priority'],
      read: false,
      actions: notification.actions?.map(action => ({
        label: action.label,
        action: () => notificationService.handleNotificationAction(notification.id, action.id)
      }))
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast for immediate feedback
    toast({
      title: notification.title,
      description: notification.message,
      duration: notification.type === 'task_start' ? 10000 : 5000,
    });
  };

  const loadLocalTasks = () => {
    try {
      const savedTasks = localStorage.getItem('ai-scheduler-tasks');
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks([...sampleTasks, ...parsedTasks]);
        toast({
          title: "Tasks Loaded",
          description: `Loaded ${parsedTasks.length} saved tasks from local storage.`,
        });
      } else {
        setTasks(sampleTasks);
      }
    } catch (error) {
      console.error("Failed to load local tasks:", error);
      setTasks(sampleTasks);
    }
  };

  const saveTasksToLocal = (tasks: Task[]) => {
    try {
      // Save only user-created tasks (exclude sample tasks)
      const userTasks = tasks.filter(task => !sampleTasks.some(sample => sample.id === task.id));
      localStorage.setItem('ai-scheduler-tasks', JSON.stringify(userTasks));
    } catch (error) {
      console.error("Failed to save tasks locally:", error);
    }
  };

  const loadSheetsData = async () => {
    setIsLoadingSheets(true);
    try {
      // Load data from Google Sheets
      const [courseData, priorityData, incompleteData] = await Promise.all([
        googleSheetsService.getCourseSchedule(),
        googleSheetsService.getPriorityTasks(),
        googleSheetsService.getIncompleteTasks()
      ]);

      setCourseSchedule(courseData);
      setPriorityTasks(priorityData);
      setIncompleteTasks(incompleteData);

      toast({
        title: "Sheets Data Loaded",
        description: `Loaded ${courseData.length} courses, ${priorityData.length} priority tasks, ${incompleteData.length} incomplete tasks.`,
      });

      // Auto-generate schedule if we have data
      if (courseData.length > 0 || priorityData.length > 0 || incompleteData.length > 0) {
        generateDailySchedule();
      }
    } catch (error) {
      console.error("Error loading sheets data:", error);
      toast({
        title: "Google Sheets Integration",
        description: "API keys provided but OAuth2 required for full integration. Working with available data.",
        variant: "default",
      });
    } finally {
      setIsLoadingSheets(false);
    }
  };

  const generateDailySchedule = async () => {
    setIsGeneratingSchedule(true);
    try {
      const preferences = {
        workingHours: { start: '08:00', end: '18:00' },
        breakDuration: 15,
        timezone: 'Asia/Kolkata'
      };

      const candidates = await geminiService.generateOptimalSchedule(
        courseSchedule,
        priorityTasks,
        incompleteTasks,
        preferences
      );

      setScheduleCandidates(candidates);

      if (candidates.length > 0) {
        toast({
          title: "Schedule Generated",
          description: `Generated ${candidates.length} optimized schedule options for today.`,
        });

        // Add system message about generated schedule
        const systemMessage = {
          id: `schedule_${Date.now()}`,
          type: "system" as const,
          content: `I've generated ${candidates.length} optimized schedule candidates based on your courses, priority tasks, and incomplete work. The best option balances your priorities with realistic time allocations.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Schedule Generation Failed",
        description: "There was an issue generating your schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  const handleTaskComplete = async (taskId: string, completed: boolean, completionData?: Partial<TaskCompletionData>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTasks = tasks.map(task => 
      task.id === taskId ? { ...task, completed, progress: completed ? 100 : task.progress } : task
    );
    setTasks(updatedTasks);
    saveTasksToLocal(updatedTasks);

    if (completed) {
      // Handle completion through notification service
      await notificationService.handleTaskCompletion({
        taskId,
        status: 'completed',
        actualDuration: task.duration,
        ...completionData
      });

      toast({
        title: "Task Completed",
        description: "Great job! Task marked as complete.",
      });
    } else {
      // Task marked as incomplete
      await notificationService.handleTaskCompletion({
        taskId,
        status: completionData?.status || 'not_completed',
        actualDuration: completionData?.actualDuration,
        remainingMinutes: completionData?.remainingMinutes,
        notes: completionData?.notes,
        reason: completionData?.reason
      });
    }
  };

  const handleAddTask = async (taskData: any) => {
    try {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        name: taskData.name,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        duration: calculateDuration(taskData.startTime, taskData.endTime),
        priority: taskData.priority,
        type: taskData.type,
        targets: taskData.targets,
        completed: false,
        progress: 0,
      };

      // Add to local state and save
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasksToLocal(updatedTasks);

      toast({
        title: "Task Added",
        description: "Task has been added to your schedule and saved locally.",
      });
    } catch (error) {
      console.error("Failed to add task:", error);
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTask = async (taskData: any) => {
    try {
      const updatedTask: Task = {
        ...editingTask,
        name: taskData.name,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
        duration: calculateDuration(taskData.startTime, taskData.endTime),
        priority: taskData.priority,
        type: taskData.type,
        targets: taskData.targets,
      };

      // Update local state and save
      const updatedTasks = tasks.map(task => 
        task.id === editingTask.id ? updatedTask : task
      );
      setTasks(updatedTasks);
      saveTasksToLocal(updatedTasks);

      toast({
        title: "Task Updated",
        description: "Task has been updated and saved locally.",
      });
      
      setEditingTask(null);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60));
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleSendMessage = async (message: string) => {
    setIsProcessing(true);
    const newMessage = {
      id: Date.now().toString(),
      type: "user" as const,
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
    
    try {
      const response = await geminiService.processSchedulingRequest({
        message,
        currentTasks: tasks,
        courseSchedule,
        priorityTasks,
        incompleteTasks,
        preferences: {
          workingHours: { start: '08:00', end: '18:00' },
          breakDuration: 15,
          timezone: 'Asia/Kolkata'
        }
      });

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        type: "agent" as const,
        content: response.response,
        timestamp: new Date().toISOString(),
        actions: response.actions
      };
      setMessages(prev => [...prev, aiResponse]);

      // If we got schedule candidates, update them
      if (response.suggestedSchedule && response.suggestedSchedule.length > 0) {
        setScheduleCandidates(response.suggestedSchedule);
        
        toast({
          title: "Schedule Updated",
          description: `Generated ${response.suggestedSchedule.length} new schedule options based on your request.`,
        });
      }

      // Handle conflicts if any
      if (response.conflicts && response.conflicts.length > 0) {
        toast({
          title: "Schedule Conflicts Detected",
          description: `Found ${response.conflicts.length} potential conflicts. Check the suggestions for resolution.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("AI Response Error:", error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        type: "agent" as const,
        content: "I'm having trouble processing your request right now. Please try again later.",
        timestamp: new Date().toISOString(),
        actions: undefined
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={cn("min-h-screen bg-gradient-subtle", className)}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI Scheduler</h1>
                  <p className="text-xs text-muted-foreground">Intelligent Task Management</p>
                </div>
              </div>
              <Badge variant="secondary" className="animate-pulse-glow">
                Connected to Gemini AI
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={loadSheetsData} disabled={isLoadingSheets}>
                <RefreshCw className={cn("h-4 w-4 mr-1", isLoadingSheets && "animate-spin")} />
                {isLoadingSheets ? "Loading..." : "Sync Sheets"}
              </Button>
              <Button variant="outline" size="sm" onClick={generateDailySchedule} disabled={isGeneratingSchedule}>
                <Zap className={cn("h-4 w-4 mr-1", isGeneratingSchedule && "animate-spin")} />
                {isGeneratingSchedule ? "Generating..." : "Generate Schedule"}
              </Button>
              <Button variant="default" size="sm" onClick={() => setShowTaskModal(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Schedule & Tasks */}
          <div className="xl:col-span-2 space-y-6">
            {/* Stats Overview */}
            <DashboardStats stats={stats} />

            {/* Schedule Candidates Section */}
            {scheduleCandidates.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">AI-Generated Schedules</h3>
                  </div>
                  <Badge variant="secondary">{scheduleCandidates.length} Options</Badge>
                </div>
                
                <div className="space-y-3">
                  {scheduleCandidates.slice(0, 2).map((candidate, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Schedule Option {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Score: {candidate.priority_score}
                          </Badge>
                          <Button size="sm" variant="default">
                            Apply Schedule
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {candidate.explainability}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{candidate.tasks.length} tasks</span>
                        <span>{candidate.timezone}</span>
                        <span>Generated: {new Date(candidate.generated_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Main Schedule View */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline View
                </TabsTrigger>
                <TabsTrigger value="tasks" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Task Cards
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline" className="mt-6">
                <ScheduleTimeline
                  date={new Date().toISOString().split('T')[0]}
                  tasks={tasks}
                  onTaskClick={(taskId) => console.log(`Clicked task: ${taskId}`)}
                />
              </TabsContent>
              
              <TabsContent value="tasks" className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Today's Tasks</h2>
                    <Badge variant="outline">
                      {tasks.filter(t => t.completed).length} / {tasks.length} completed
                    </Badge>
                  </div>
                  {tasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                      onEdit={() => openEditModal(task)}
                      onReschedule={(task) => {
                        setEditingTask(task);
                        setShowTaskModal(true);
                        toast({
                          title: "Reschedule Task",
                          description: "Modify the time and settings for this task.",
                        });
                      }}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - AI Chat & Notifications */}
          <div className="space-y-6">
            {/* AI Chat Interface */}
            <AiChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onVoiceInput={() => console.log("Voice input activated")}
              isProcessing={isProcessing}
            />

            {/* Notification Center */}
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={(id) => {
                setNotifications(prev => prev.map(n => 
                  n.id === id ? { ...n, read: true } : n
                ));
              }}
              onDismiss={(id) => {
                setNotifications(prev => prev.filter(n => n.id !== id));
              }}
              onClearAll={() => setNotifications([])}
            />
          </div>
        </div>
      </main>

      {/* Task Form Modal */}
      <TaskFormModal
        open={showTaskModal}
        onOpenChange={(open) => {
          setShowTaskModal(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleEditTask : handleAddTask}
        initialData={editingTask ? {
          name: editingTask.name,
          startTime: editingTask.startTime,
          endTime: editingTask.endTime,
          priority: editingTask.priority,
          type: editingTask.type,
          targets: editingTask.targets,
        } : undefined}
        mode={editingTask ? "edit" : "add"}
      />
    </div>
  );
}