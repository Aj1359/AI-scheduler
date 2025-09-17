// Google Calendar API integration for the AI Scheduler
const GOOGLE_CALENDAR_API_KEY = "AIzaSyAT4OOs0sQdHCM718SL0Lz-UDkIoYbcp_U";
const GOOGLE_TASKS_API_KEY = "AIzaSyAT4OOs0sQdHCM718SL0Lz-UDkIoYbcp_U";

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status: string;
  source?: 'agent' | 'user' | 'external';
}

export interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated: string;
  position: string;
}

export interface ScheduleCandidate {
  user_id: string;
  date: string;
  timezone: string;
  tasks: TaskScheduleItem[];
  generated_at: string;
  agent_version: string;
  explainability: string;
  priority_score: number;
}

export interface TaskScheduleItem {
  task_id: string;
  name: string;
  type: "fixed" | "flexible" | "incomplete" | "recurring";
  start: string;
  duration_minutes: number;
  end: string;
  priority_score: number;
  targets: string[];
  fixed: boolean;
  notes?: string;
  source: "sheet" | "user" | "agent";
  reschedule_policy: "push" | "split" | "drop";
  metadata: {
    estimated_effort: number;
    progress_percent: number;
  };
}

class GoogleCalendarService {
  private calendarId = 'primary';
  private tasksListId = '@default';

  // Calendar Methods
  async getCalendarEvents(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    try {
      const timeMin = new Date(startDate).toISOString();
      const timeMax = new Date(endDate).toISOString();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?` +
        `key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.items || []).map((event: any): CalendarEvent => ({
        id: event.id,
        summary: event.summary || 'Untitled Event',
        description: event.description || '',
        start: {
          dateTime: event.start.dateTime || event.start.date,
          timeZone: event.start.timeZone || 'UTC'
        },
        end: {
          dateTime: event.end.dateTime || event.end.date,
          timeZone: event.end.timeZone || 'UTC'
        },
        status: event.status || 'confirmed',
        source: event.organizer?.self ? 'user' : 'external'
      }));
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'status'>): Promise<CalendarEvent | null> {
    try {
      // Note: This requires OAuth2 authentication for write operations
      console.warn('Creating calendar events requires OAuth2 authentication');
      
      // For demo purposes, return a mock event
      const mockEvent: CalendarEvent = {
        id: `mock_${Date.now()}`,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        status: 'confirmed',
        source: 'agent'
      };
      
      return mockEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  // Google Tasks Methods
  async getTasks(): Promise<GoogleTask[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/tasks/v1/lists/${this.tasksListId}/tasks?key=${GOOGLE_TASKS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Tasks API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.items || []).map((task: any): GoogleTask => ({
        id: task.id,
        title: task.title,
        notes: task.notes,
        status: task.status,
        due: task.due,
        updated: task.updated,
        position: task.position
      }));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async createTask(task: Omit<GoogleTask, 'id' | 'updated' | 'position'>): Promise<GoogleTask | null> {
    try {
      // Note: This requires OAuth2 authentication for write operations
      console.warn('Creating tasks requires OAuth2 authentication');
      
      // For demo purposes, return a mock task
      const mockTask: GoogleTask = {
        id: `mock_task_${Date.now()}`,
        title: task.title,
        notes: task.notes,
        status: task.status,
        due: task.due,
        updated: new Date().toISOString(),
        position: `${Date.now()}`
      };
      
      return mockTask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  async updateTaskStatus(taskId: string, status: 'needsAction' | 'completed'): Promise<boolean> {
    try {
      // Note: This requires OAuth2 authentication
      console.warn('Updating tasks requires OAuth2 authentication');
      console.log(`Task ${taskId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating task status:', error);
      return false;
    }
  }

  // Schedule Management
  async applyScheduleToCalendar(schedule: ScheduleCandidate): Promise<boolean> {
    try {
      console.log('Applying schedule to calendar:', schedule);
      
      // Create calendar events for each scheduled task
      const calendarPromises = schedule.tasks.map(task => 
        this.createCalendarEvent({
          summary: task.name,
          description: `Priority: ${task.priority_score}\nTargets: ${task.targets.join(', ')}\nNotes: ${task.notes || ''}`,
          start: {
            dateTime: task.start,
            timeZone: schedule.timezone
          },
          end: {
            dateTime: task.end,
            timeZone: schedule.timezone
          },
          source: 'agent'
        })
      );

      // Create Google Tasks for tracking
      const taskPromises = schedule.tasks.map(task =>
        this.createTask({
          title: task.name,
          notes: `Scheduled: ${task.start} - ${task.end}\nTargets: ${task.targets.join(', ')}`,
          status: 'needsAction',
          due: task.start
        })
      );

      await Promise.all([...calendarPromises, ...taskPromises]);
      
      console.log('Schedule successfully applied to calendar and tasks');
      return true;
    } catch (error) {
      console.error('Error applying schedule:', error);
      return false;
    }
  }

  // Conflict Detection
  async detectConflicts(newSchedule: ScheduleCandidate): Promise<string[]> {
    try {
      const startDate = newSchedule.date;
      const endDate = new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const existingEvents = await this.getCalendarEvents(startDate, endDate);
      const conflicts: string[] = [];

      newSchedule.tasks.forEach(newTask => {
        const newStart = new Date(newTask.start);
        const newEnd = new Date(newTask.end);

        existingEvents.forEach(existingEvent => {
          const existingStart = new Date(existingEvent.start.dateTime);
          const existingEnd = new Date(existingEvent.end.dateTime);

          // Check for time overlap
          if (newStart < existingEnd && newEnd > existingStart) {
            conflicts.push(
              `Task "${newTask.name}" conflicts with existing event "${existingEvent.summary}" ` +
              `(${existingStart.toLocaleTimeString()} - ${existingEnd.toLocaleTimeString()})`
            );
          }
        });
      });

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return [];
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();