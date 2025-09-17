// Notification Service for task lifecycle management
export interface NotificationConfig {
  id: string;
  type: 'task_start' | 'task_end' | 'reminder' | 'schedule_update' | 'system';
  title: string;
  message: string;
  taskId?: string;
  scheduledTime: string;
  delivered: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'snooze' | 'complete' | 'reschedule' | 'cancel';
  payload?: any;
}

export interface TaskCompletionData {
  taskId: string;
  status: 'completed' | 'partially_completed' | 'not_completed';
  actualDuration?: number;
  remainingMinutes?: number;
  notes?: string;
  reason?: string;
}

class NotificationService {
  private notifications: Map<string, NotificationConfig> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: ((notification: NotificationConfig) => void)[] = [];

  // Subscription management
  subscribe(callback: (notification: NotificationConfig) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  private notifySubscribers(notification: NotificationConfig) {
    this.subscribers.forEach(callback => callback(notification));
  }

  // Schedule task start notification
  scheduleTaskStartNotification(taskId: string, taskName: string, startTime: string): string {
    const notificationId = `start_${taskId}`;
    const startDate = new Date(startTime);
    const reminderTime = new Date(startDate.getTime() - 5 * 60 * 1000); // 5 minutes before

    const notification: NotificationConfig = {
      id: notificationId,
      type: 'task_start',
      title: `Task Starting Soon`,
      message: `"${taskName}" starts in 5 minutes`,
      taskId,
      scheduledTime: reminderTime.toISOString(),
      delivered: false,
      actions: [
        { id: 'snooze', label: 'Snooze 5min', type: 'snooze', payload: { minutes: 5 } },
        { id: 'start', label: 'Start Now', type: 'complete', payload: { action: 'start' } }
      ]
    };

    this.notifications.set(notificationId, notification);

    // Schedule the notification
    const timeUntilNotification = Math.max(0, reminderTime.getTime() - Date.now());
    const timer = setTimeout(() => {
      this.deliverNotification(notificationId);
    }, timeUntilNotification);

    this.timers.set(notificationId, timer);

    return notificationId;
  }

  // Schedule task end notification
  scheduleTaskEndNotification(taskId: string, taskName: string, endTime: string): string {
    const notificationId = `end_${taskId}`;
    const endDate = new Date(endTime);

    const notification: NotificationConfig = {
      id: notificationId,
      type: 'task_end',
      title: `Task Completed?`,
      message: `How did "${taskName}" go?`,
      taskId,
      scheduledTime: endDate.toISOString(),
      delivered: false,
      actions: [
        { id: 'completed', label: 'Completed', type: 'complete', payload: { status: 'completed' } },
        { id: 'partial', label: 'Partial', type: 'complete', payload: { status: 'partially_completed' } },
        { id: 'not_completed', label: 'Not Done', type: 'complete', payload: { status: 'not_completed' } }
      ]
    };

    this.notifications.set(notificationId, notification);

    // Schedule the notification
    const timeUntilNotification = Math.max(0, endDate.getTime() - Date.now());
    const timer = setTimeout(() => {
      this.deliverNotification(notificationId);
    }, timeUntilNotification);

    this.timers.set(notificationId, timer);

    return notificationId;
  }

  // Deliver notification
  private deliverNotification(notificationId: string) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.delivered) return;

    notification.delivered = true;
    this.notifySubscribers(notification);

    // Send browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };

      // Auto-close after 10 seconds
      setTimeout(() => browserNotification.close(), 10000);
    }

    // Custom notification (in-app)
    this.showCustomNotification(notification);
  }

  private showCustomNotification(notification: NotificationConfig) {
    // This would trigger the UI notification system
    console.log('Custom Notification:', notification);
    
    // Create a custom notification element or trigger toast
    const event = new CustomEvent('ai-scheduler-notification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  // Handle task completion
  async handleTaskCompletion(completionData: TaskCompletionData): Promise<void> {
    console.log('Task completion data:', completionData);

    try {
      // Process completion based on status
      switch (completionData.status) {
        case 'completed':
          await this.processCompletedTask(completionData);
          break;
        case 'partially_completed':
          await this.processPartiallyCompletedTask(completionData);
          break;
        case 'not_completed':
          await this.processIncompleteTask(completionData);
          break;
      }

      // Send completion notification
      this.sendCompletionFeedback(completionData);
    } catch (error) {
      console.error('Error handling task completion:', error);
    }
  }

  private async processCompletedTask(data: TaskCompletionData) {
    // Mark task as completed in Google Tasks
    console.log(`Task ${data.taskId} marked as completed`);
    
    // Log completion time and efficiency
    const completionLog = {
      taskId: data.taskId,
      completedAt: new Date().toISOString(),
      actualDuration: data.actualDuration,
      notes: data.notes
    };
    
    // Store completion data for analytics
    this.storeCompletionData(completionLog);
  }

  private async processPartiallyCompletedTask(data: TaskCompletionData) {
    console.log(`Task ${data.taskId} partially completed`);
    
    if (data.remainingMinutes && data.remainingMinutes > 0) {
      // Move remaining work to incomplete tasks
      await this.moveToIncompleteSheet(data);
    }
  }

  private async processIncompleteTask(data: TaskCompletionData) {
    console.log(`Task ${data.taskId} not completed`);
    
    // Move entire task to incomplete sheet for next day
    await this.moveToIncompleteSheet(data);
  }

  private async moveToIncompleteSheet(data: TaskCompletionData) {
    // This would integrate with the Google Sheets service
    console.log('Moving task to incomplete sheet:', data);

    const incompleteTask = {
      id: `incomplete_${Date.now()}`,
      name: `Incomplete: ${data.taskId}`,
      originalDuration: data.actualDuration || 60,
      remainingDuration: data.remainingMinutes || 60,
      priority: 'medium' as const,
      sourceDate: new Date().toISOString().split('T')[0],
      progress: data.status === 'partially_completed' ? 50 : 0,
      notes: data.notes || data.reason || 'Task needs to be rescheduled'
    };

    // This would call googleSheetsService.addIncompleteTask(incompleteTask)
    console.log('Incomplete task created:', incompleteTask);
  }

  private sendCompletionFeedback(data: TaskCompletionData) {
    let message = '';
    let type: NotificationConfig['type'] = 'system';

    switch (data.status) {
      case 'completed':
        message = 'Great job! Task completed successfully.';
        break;
      case 'partially_completed':
        message = `Task partially completed. Remaining work scheduled for tomorrow.`;
        break;
      case 'not_completed':
        message = 'Task moved to tomorrow\'s schedule.';
        break;
    }

    const feedback: NotificationConfig = {
      id: `feedback_${data.taskId}_${Date.now()}`,
      type,
      title: 'Task Update',
      message,
      taskId: data.taskId,
      scheduledTime: new Date().toISOString(),
      delivered: false
    };

    setTimeout(() => this.deliverNotification(feedback.id), 1000);
    this.notifications.set(feedback.id, feedback);
  }

  private storeCompletionData(completionLog: any) {
    // Store in localStorage for now, could be sent to backend
    const existingLogs = JSON.parse(localStorage.getItem('task-completion-logs') || '[]');
    existingLogs.push(completionLog);
    localStorage.setItem('task-completion-logs', JSON.stringify(existingLogs));
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permissions denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Handle notification actions
  handleNotificationAction(notificationId: string, actionId: string) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return;

    console.log(`Notification action: ${actionId} for ${notificationId}`, action.payload);

    // Process the action based on type
    switch (action.type) {
      case 'snooze':
        this.snoozeNotification(notificationId, action.payload?.minutes || 5);
        break;
      case 'complete':
        this.handleTaskCompletion({
          taskId: notification.taskId || '',
          status: action.payload?.status || 'completed',
          notes: action.payload?.notes
        });
        break;
      case 'reschedule':
        // Trigger reschedule UI
        console.log('Reschedule requested for task:', notification.taskId);
        break;
    }
  }

  private snoozeNotification(notificationId: string, minutes: number) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;

    // Cancel existing timer
    const existingTimer = this.timers.get(notificationId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Reschedule for later
    notification.delivered = false;
    notification.scheduledTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const timer = setTimeout(() => {
      this.deliverNotification(notificationId);
    }, minutes * 60 * 1000);

    this.timers.set(notificationId, timer);
  }

  // Cleanup
  cleanup() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.notifications.clear();
    this.subscribers.length = 0;
  }

  // Get all notifications
  getAllNotifications(): NotificationConfig[] {
    return Array.from(this.notifications.values());
  }

  // Get pending notifications
  getPendingNotifications(): NotificationConfig[] {
    return Array.from(this.notifications.values()).filter(n => !n.delivered);
  }
}

export const notificationService = new NotificationService();