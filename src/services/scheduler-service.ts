// Advanced AI Scheduler Service
import { geminiService } from './gemini-ai';
import { googleSheetsService } from './google-sheets';
import { googleCalendarService } from './google-calendar';
import { notificationService } from './notification-service';

export interface Task {
  task_id: string;
  name: string;
  type: 'fixed' | 'flexible' | 'incomplete' | 'recurring';
  start: string; // ISO8601
  duration_minutes: number;
  end: string; // ISO8601
  priority_score: number;
  targets: string[];
  fixed: boolean;
  notes?: string;
  source: 'sheet' | 'user' | 'agent';
  reschedule_policy: 'push' | 'split' | 'drop';
  metadata: {
    estimated_effort: number;
    progress_percent: number;
  };
}

export interface SchedulePayload {
  user_id: string;
  date: string; // YYYY-MM-DD
  timezone: string;
  tasks: Task[];
  generated_at: string; // ISO8601
  agent_version: string;
  explainability: string;
}

export interface ScheduleCandidate {
  id: string;
  schedule: SchedulePayload;
  score: number;
  explanation: string;
  conflicts: string[];
}

export interface UserPreferences {
  sleep_window: { start: string; end: string };
  work_hours: { start: string; end: string };
  break_duration: number; // minutes
  commute_buffer: number; // minutes
  preferred_task_duration: number; // minutes
  max_consecutive_work: number; // minutes
}

class SchedulerService {
  private currentSchedule: SchedulePayload | null = null;
  private userPreferences: UserPreferences = {
    sleep_window: { start: '22:00', end: '07:00' },
    work_hours: { start: '09:00', end: '18:00' },
    break_duration: 15,
    commute_buffer: 30,
    preferred_task_duration: 90,
    max_consecutive_work: 180
  };

  // Generate optimized daily schedule
  async generateDailySchedule(date: string, userId: string): Promise<ScheduleCandidate[]> {
    try {
      console.log(`Generating schedule for ${date}`);

      // 1. Load all data sources
      const [courseSchedule, priorityTasks, incompleteTasks] = await Promise.all([
        googleSheetsService.getCourseSchedule(),
        googleSheetsService.getPriorityTasks(),
        googleSheetsService.getIncompleteTasks()
      ]);

      // 2. Get existing calendar events
      const existingEvents = await googleCalendarService.getCalendarEvents(date, date);

      // 3. Process and normalize tasks
      const allTasks = this.normalizeTasks(courseSchedule, priorityTasks, incompleteTasks);

      // 4. Use Gemini AI to generate candidate schedules
      const candidates = await this.generateScheduleCandidates(
        allTasks,
        existingEvents,
        date,
        userId
      );

      return candidates;
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw new Error('Failed to generate schedule');
    }
  }

  // Apply selected schedule to calendar and tasks
  async applySchedule(candidate: ScheduleCandidate): Promise<void> {
    try {
      console.log('Applying schedule:', candidate.id);

      // 1. Create calendar events
      const calendarPromises = candidate.schedule.tasks
        .filter(task => !task.fixed) // Don't recreate fixed events
        .map(task => googleCalendarService.createCalendarEvent({
          summary: task.name,
          start: { dateTime: task.start, timeZone: 'Asia/Kolkata' },
          end: { dateTime: task.end, timeZone: 'Asia/Kolkata' },
          description: `Priority: ${task.priority_score}\nTargets: ${task.targets.join(', ')}\nNotes: ${task.notes || ''}`,
          source: 'agent'
        }));

      // 2. Create Google Tasks
      const taskPromises = candidate.schedule.tasks.map(task => 
        googleCalendarService.createTask({
          title: task.name,
          notes: task.notes || '',
          due: task.end,
          status: 'needsAction'
        })
      );

      // 3. Schedule notifications
      const notificationPromises = candidate.schedule.tasks.map(task => {
        notificationService.scheduleTaskStartNotification(
          task.task_id,
          task.name,
          task.start
        );
        return notificationService.scheduleTaskEndNotification(
          task.task_id,
          task.name,
          task.end
        );
      });

      // Execute all operations
      await Promise.all([...calendarPromises, ...taskPromises]);
      
      // Store current schedule
      this.currentSchedule = candidate.schedule;

      console.log('Schedule applied successfully');
    } catch (error) {
      console.error('Error applying schedule:', error);
      throw new Error('Failed to apply schedule');
    }
  }

  // Handle live chat modifications
  async handleChatModification(message: string): Promise<ScheduleCandidate[]> {
    if (!this.currentSchedule) {
      throw new Error('No active schedule to modify');
    }

    try {
      // Use Gemini AI to understand the modification request
      const modificationRequest = await geminiService.processScheduleModification(
        message,
        this.currentSchedule
      );

      // Generate new schedule candidates with the modification
      const candidates = await this.generateModifiedSchedule(modificationRequest);

      return candidates;
    } catch (error) {
      console.error('Error handling chat modification:', error);
      throw new Error('Failed to process schedule modification');
    }
  }

  // Private helper methods
  private normalizeTasks(
    courseSchedule: any[],
    priorityTasks: any[],
    incompleteTasks: any[]
  ): Task[] {
    const tasks: Task[] = [];

    // Process course schedule (fixed tasks)
    courseSchedule.forEach((course, index) => {
      if (course.day_of_week && course.start_time && course.end_time) {
        tasks.push({
          task_id: `course_${index}`,
          name: course.event_name || 'Class',
          type: 'fixed',
          start: this.convertToISO(course.start_time),
          duration_minutes: this.calculateDuration(course.start_time, course.end_time),
          end: this.convertToISO(course.end_time),
          priority_score: 100, // Fixed tasks have highest priority
          targets: ['attend_class'],
          fixed: true,
          source: 'sheet',
          reschedule_policy: 'drop', // Can't reschedule fixed tasks
          metadata: {
            estimated_effort: 100,
            progress_percent: 0
          }
        });
      }
    });

    // Process priority tasks (flexible)
    priorityTasks.forEach((task, index) => {
      tasks.push({
        task_id: `priority_${index}`,
        name: task.name || 'Priority Task',
        type: 'flexible',
        start: task.preferred_time || '09:00',
        duration_minutes: task.duration || 60,
        end: '', // Will be calculated
        priority_score: task.priority || 75,
        targets: task.targets ? task.targets.split(',') : ['productivity'],
        fixed: false,
        source: 'sheet',
        reschedule_policy: 'push',
        metadata: {
          estimated_effort: task.difficulty || 50,
          progress_percent: 0
        }
      });
    });

    // Process incomplete tasks
    incompleteTasks.forEach((task, index) => {
      tasks.push({
        task_id: `incomplete_${index}`,
        name: task.name || 'Incomplete Task',
        type: 'incomplete',
        start: '10:00', // Default start time
        duration_minutes: task.remaining_duration || 30,
        end: '', // Will be calculated
        priority_score: task.priority + 10, // Slightly higher priority
        targets: ['completion'],
        fixed: false,
        source: 'sheet',
        reschedule_policy: 'split',
        metadata: {
          estimated_effort: task.difficulty || 30,
          progress_percent: task.progress || 0
        }
      });
    });

    return tasks;
  }

  private async generateScheduleCandidates(
    tasks: Task[],
    existingEvents: any[],
    date: string,
    userId: string
  ): Promise<ScheduleCandidate[]> {
    const prompt = `
Generate 3 optimized daily schedule candidates for ${date}.

CONSTRAINTS:
- Work hours: ${this.userPreferences.work_hours.start} - ${this.userPreferences.work_hours.end}
- Sleep window: ${this.userPreferences.sleep_window.start} - ${this.userPreferences.sleep_window.end}
- Break duration: ${this.userPreferences.break_duration} minutes between tasks
- Max consecutive work: ${this.userPreferences.max_consecutive_work} minutes

TASKS TO SCHEDULE:
${JSON.stringify(tasks, null, 2)}

EXISTING CALENDAR EVENTS:
${JSON.stringify(existingEvents, null, 2)}

REQUIREMENTS:
1. Fixed tasks cannot be moved
2. Optimize for priority_score and target fulfillment
3. Include buffer time between tasks
4. Provide explanation for each candidate
5. Identify any conflicts

Return JSON with structure:
{
  "candidates": [
    {
      "id": "candidate_1",
      "schedule": {
        "user_id": "${userId}",
        "date": "${date}",
        "timezone": "Asia/Kolkata",
        "tasks": [...],
        "generated_at": "${new Date().toISOString()}",
        "agent_version": "1.0.0",
        "explainability": "Short explanation of scheduling decisions"
      },
      "score": 85,
      "explanation": "Detailed explanation of this candidate",
      "conflicts": []
    }
  ]
}
`;

    try {
      const response = await geminiService.generateSchedule(prompt);
      return response.candidates || [];
    } catch (error) {
      console.error('Error generating candidates with AI:', error);
      return this.generateFallbackSchedule(tasks, date, userId);
    }
  }

  private generateFallbackSchedule(tasks: Task[], date: string, userId: string): ScheduleCandidate[] {
    // Simple fallback: sort by priority and allocate sequentially
    const sortedTasks = [...tasks].sort((a, b) => b.priority_score - a.priority_score);
    let currentTime = new Date(`${date}T${this.userPreferences.work_hours.start}`);

    const scheduledTasks: Task[] = sortedTasks.map(task => {
      const start = new Date(currentTime);
      const end = new Date(start.getTime() + task.duration_minutes * 60000);
      
      currentTime = new Date(end.getTime() + this.userPreferences.break_duration * 60000);

      return {
        ...task,
        start: start.toISOString(),
        end: end.toISOString()
      };
    });

    return [{
      id: 'fallback_1',
      schedule: {
        user_id: userId,
        date,
        timezone: 'Asia/Kolkata',
        tasks: scheduledTasks,
        generated_at: new Date().toISOString(),
        agent_version: '1.0.0',
        explainability: 'Fallback schedule: tasks sorted by priority'
      },
      score: 60,
      explanation: 'Basic priority-based scheduling (AI unavailable)',
      conflicts: []
    }];
  }

  private async generateModifiedSchedule(modification: any): Promise<ScheduleCandidate[]> {
    // This would implement the modification logic
    // For now, return the current schedule
    if (!this.currentSchedule) return [];

    return [{
      id: 'modified_1',
      schedule: this.currentSchedule,
      score: 70,
      explanation: 'Schedule modified based on user request',
      conflicts: []
    }];
  }

  // Utility methods
  private convertToISO(timeString: string): string {
    const today = new Date().toISOString().split('T')[0];
    return `${today}T${timeString}:00+05:30`;
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60);
  }

  // Public getters
  getCurrentSchedule(): SchedulePayload | null {
    return this.currentSchedule;
  }

  getUserPreferences(): UserPreferences {
    return this.userPreferences;
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences };
  }
}

export const schedulerService = new SchedulerService();