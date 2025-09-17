// Google Sheets API integration
const GOOGLE_SHEETS_API_KEY = "AIzaSyAT4OOs0sQdHCM718SL0Lz-UDkIoYbcp_U";
const SHEET_ID = "1g-LOE_fgv6TsJ2gBf7yT2rHRaBF-oit_TD72IadQ6cY";

// Sheet GIDs based on the URLs provided
const SHEETS = {
  COURSE_SCHEDULE: "0", // Main sheet
  PRIORITY_TASKS: "1742028851",
  INCOMPLETE_TASKS: "1522293859",
} as const;

export interface CourseScheduleItem {
  day: string;
  time: string;
  course: string;
  location?: string;
  instructor?: string;
}

export interface PriorityTask {
  id: string;
  name: string;
  priority: "critical" | "high" | "medium" | "low";
  estimatedDuration: number;
  dueDate?: string;
  targets: string[];
  notes?: string;
}

export interface IncompleteTask {
  id: string;
  name: string;
  originalDuration: number;
  remainingDuration: number;
  priority: "critical" | "high" | "medium" | "low";
  sourceDate: string;
  progress: number;
  notes?: string;
}

class GoogleSheetsService {
  private baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

  private async fetchSheet(gid: string, range?: string): Promise<any[][]> {
    try {
      const sheetName = this.getSheetName(gid);
      const fullRange = range ? `${sheetName}!${range}` : sheetName;
      
      const response = await fetch(
        `${this.baseUrl}/values/${fullRange}?key=${GOOGLE_SHEETS_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sheet: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error("Error fetching Google Sheet:", error);
      return [];
    }
  }

  private async updateSheet(gid: string, range: string, values: any[][]): Promise<void> {
    try {
      const sheetName = this.getSheetName(gid);
      const fullRange = `${sheetName}!${range}`;
      
      const response = await fetch(
        `${this.baseUrl}/values/${fullRange}?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to update sheet: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating Google Sheet:", error);
      throw error;
    }
  }

  private async appendToSheet(gid: string, values: any[][]): Promise<void> {
    try {
      const sheetName = this.getSheetName(gid);
      
      const response = await fetch(
        `${this.baseUrl}/values/${sheetName}:append?valueInputOption=RAW&key=${GOOGLE_SHEETS_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to append to sheet: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error appending to Google Sheet:", error);
      throw error;
    }
  }

  private getSheetName(gid: string): string {
    switch (gid) {
      case SHEETS.COURSE_SCHEDULE:
        return "Course Schedule";
      case SHEETS.PRIORITY_TASKS:
        return "Priority Tasks";
      case SHEETS.INCOMPLETE_TASKS:
        return "Incomplete Tasks";
      default:
        return "Sheet1";
    }
  }

  // Course Schedule methods
  async getCourseSchedule(): Promise<CourseScheduleItem[]> {
    const rows = await this.fetchSheet(SHEETS.COURSE_SCHEDULE);
    if (rows.length === 0) return [];
    
    // Skip header row
    return rows.slice(1).map((row, index) => ({
      day: row[0] || "",
      time: row[1] || "",
      course: row[2] || "",
      location: row[3] || "",
      instructor: row[4] || "",
    }));
  }

  // Priority Tasks methods
  async getPriorityTasks(): Promise<PriorityTask[]> {
    const rows = await this.fetchSheet(SHEETS.PRIORITY_TASKS);
    if (rows.length === 0) return [];
    
    return rows.slice(1).map((row, index) => ({
      id: row[0] || `priority_${index}`,
      name: row[1] || "",
      priority: (row[2]?.toLowerCase() || "medium") as PriorityTask["priority"],
      estimatedDuration: parseInt(row[3]) || 60,
      dueDate: row[4] || "",
      targets: (row[5] || "").split(",").map((t: string) => t.trim()).filter(Boolean),
      notes: row[6] || "",
    }));
  }

  async addPriorityTask(task: Omit<PriorityTask, "id">): Promise<void> {
    const newRow = [
      `priority_${Date.now()}`,
      task.name,
      task.priority,
      task.estimatedDuration.toString(),
      task.dueDate || "",
      task.targets.join(", "),
      task.notes || "",
    ];
    
    await this.appendToSheet(SHEETS.PRIORITY_TASKS, [newRow]);
  }

  async updatePriorityTask(taskId: string, updates: Partial<PriorityTask>): Promise<void> {
    const tasks = await this.getPriorityTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { ...tasks[taskIndex], ...updates };
    const updatedRow = [
      updatedTask.id,
      updatedTask.name,
      updatedTask.priority,
      updatedTask.estimatedDuration.toString(),
      updatedTask.dueDate || "",
      updatedTask.targets.join(", "),
      updatedTask.notes || "",
    ];
    
    // Row index is taskIndex + 2 (1 for 0-based index, 1 for header row)
    const range = `A${taskIndex + 2}:G${taskIndex + 2}`;
    await this.updateSheet(SHEETS.PRIORITY_TASKS, range, [updatedRow]);
  }

  // Incomplete Tasks methods
  async getIncompleteTasks(): Promise<IncompleteTask[]> {
    const rows = await this.fetchSheet(SHEETS.INCOMPLETE_TASKS);
    if (rows.length === 0) return [];
    
    return rows.slice(1).map((row, index) => ({
      id: row[0] || `incomplete_${index}`,
      name: row[1] || "",
      originalDuration: parseInt(row[2]) || 60,
      remainingDuration: parseInt(row[3]) || 60,
      priority: (row[4]?.toLowerCase() || "medium") as IncompleteTask["priority"],
      sourceDate: row[5] || "",
      progress: parseInt(row[6]) || 0,
      notes: row[7] || "",
    }));
  }

  async addIncompleteTask(task: Omit<IncompleteTask, "id">): Promise<void> {
    const newRow = [
      `incomplete_${Date.now()}`,
      task.name,
      task.originalDuration.toString(),
      task.remainingDuration.toString(),
      task.priority,
      task.sourceDate,
      task.progress.toString(),
      task.notes || "",
    ];
    
    await this.appendToSheet(SHEETS.INCOMPLETE_TASKS, [newRow]);
  }

  async updateIncompleteTask(taskId: string, updates: Partial<IncompleteTask>): Promise<void> {
    const tasks = await this.getIncompleteTasks();
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { ...tasks[taskIndex], ...updates };
    const updatedRow = [
      updatedTask.id,
      updatedTask.name,
      updatedTask.originalDuration.toString(),
      updatedTask.remainingDuration.toString(),
      updatedTask.priority,
      updatedTask.sourceDate,
      updatedTask.progress.toString(),
      updatedTask.notes || "",
    ];
    
    const range = `A${taskIndex + 2}:H${taskIndex + 2}`;
    await this.updateSheet(SHEETS.INCOMPLETE_TASKS, range, [updatedRow]);
  }

  async removeIncompleteTask(taskId: string): Promise<void> {
    // Note: Google Sheets API doesn't have a direct delete row method
    // This would require more complex operations or using the batchUpdate method
    console.warn("Remove incomplete task not implemented - requires batchUpdate API");
  }
}

export const googleSheetsService = new GoogleSheetsService();