import { Task } from "@/components/dashboard-layout";
import { CourseScheduleItem, PriorityTask, IncompleteTask } from "./google-sheets";
import { TaskScheduleItem, ScheduleCandidate } from "./google-calendar";

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

interface SchedulingRequest {
  message: string;
  currentTasks: Task[];
  courseSchedule?: CourseScheduleItem[];
  priorityTasks?: PriorityTask[];
  incompleteTasks?: IncompleteTask[];
  preferences?: {
    workingHours?: { start: string; end: string };
    breakDuration?: number;
    priorities?: string[];
    timezone?: string;
  };
}

interface SchedulingResponse {
  response: string;
  suggestedSchedule?: ScheduleCandidate[];
  actions?: {
    label: string;
    action: () => void;
  }[];
  conflicts?: string[];
  explainability?: string;
}

const GEMINI_API_KEY = "AIzaSyBmrMvq1Q5LfbMmOLBxmt4IsoVFd4be6Jg";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

export class GeminiAIService {
  private async makeRequest(messages: GeminiMessage[]): Promise<string> {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process your request.";
    } catch (error) {
      console.error("Gemini AI Error:", error);
      return "I'm having trouble connecting to the AI service. Please try again later.";
    }
  }

  private async makeStructuredRequest(messages: GeminiMessage[]): Promise<any> {
    try {
      const response = await this.makeRequest(messages);
      
      // Try to extract JSON from the response
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      return { response, structured: false };
    } catch (error) {
      console.error("Structured request error:", error);
      return { response: "Error processing structured request", structured: false };
    }
  }

  async processSchedulingRequest(request: SchedulingRequest): Promise<SchedulingResponse> {
    const systemPrompt = this.buildSystemPrompt(request);
    
    const messages: GeminiMessage[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      }
    ];

    // Check if this is a schedule generation request
    const isScheduleGeneration = this.isScheduleGenerationRequest(request.message);
    
    if (isScheduleGeneration) {
      return await this.generateScheduleCandidates(request);
    } else {
      // Handle conversational scheduling requests
      const response = await this.makeRequest(messages);
      
      const actions = this.extractPossibleActions(request.message, response);

      return {
        response,
        actions,
        explainability: "Processed conversational scheduling request"
      };
    }
  }

  private buildSystemPrompt(request: SchedulingRequest): string {
    const timezone = request.preferences?.timezone || 'Asia/Kolkata';
    const workingHours = request.preferences?.workingHours || { start: '08:00', end: '18:00' };
    
    let prompt = `You are an intelligent scheduling assistant that creates optimized daily schedules.

CURRENT DATE: ${new Date().toISOString().split('T')[0]}
TIMEZONE: ${timezone}
WORKING HOURS: ${workingHours.start} - ${workingHours.end}

`;

    // Add course schedule if available
    if (request.courseSchedule && request.courseSchedule.length > 0) {
      prompt += `FIXED COURSE SCHEDULE (These are immovable):
${request.courseSchedule.map(course => 
  `- ${course.day}: ${course.time} - ${course.course} at ${course.location || 'TBD'}`
).join('\n')}

`;
    }

    // Add priority tasks
    if (request.priorityTasks && request.priorityTasks.length > 0) {
      prompt += `PRIORITY TASKS (Flexible timing):
${request.priorityTasks.map(task => 
  `- ${task.name} (${task.estimatedDuration}min, Priority: ${task.priority}, Due: ${task.dueDate || 'No deadline'}, Targets: ${task.targets.join(', ')})`
).join('\n')}

`;
    }

    // Add incomplete tasks
    if (request.incompleteTasks && request.incompleteTasks.length > 0) {
      prompt += `INCOMPLETE TASKS (From previous days - High priority for today):
${request.incompleteTasks.map(task => 
  `- ${task.name} (${task.remainingDuration}min remaining, Original: ${task.originalDuration}min, Priority: ${task.priority}, Progress: ${task.progress}%)`
).join('\n')}

`;
    }

    // Add current tasks
    if (request.currentTasks.length > 0) {
      prompt += `CURRENT SCHEDULED TASKS:
${request.currentTasks.map(task => 
  `- ${task.name} (${task.startTime}-${task.endTime}, Priority: ${task.priority}, Type: ${task.type})`
).join('\n')}

`;
    }

    prompt += `SCHEDULING GUIDELINES:
- Fixed tasks (classes) cannot be moved - schedule around them
- Consider task priorities: critical > high > medium > low
- Incomplete tasks should be prioritized to catch up
- Include 15-minute breaks between tasks when possible
- Optimize for productivity and work-life balance
- Consider energy levels (complex tasks in morning when possible)
- Respect working hours unless explicitly requested otherwise
- Provide realistic time allocations

USER REQUEST: ${request.message}

Provide a helpful response with clear scheduling recommendations and explanations.`;

    return prompt;
  }

  private isScheduleGenerationRequest(message: string): boolean {
    const generationKeywords = [
      'generate schedule', 'create schedule', 'make schedule', 'optimize schedule',
      'plan my day', 'schedule for today', 'daily schedule', 'organize my day'
    ];
    
    const lowerMessage = message.toLowerCase();
    return generationKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private extractPossibleActions(message: string, response: string): Array<{label: string, action: () => void}> | undefined {
    const hasScheduleRequest = message.toLowerCase().includes('schedule') || 
                              message.toLowerCase().includes('reschedule') ||
                              message.toLowerCase().includes('optimize') ||
                              message.toLowerCase().includes('move') ||
                              message.toLowerCase().includes('add');

    if (hasScheduleRequest) {
      return [
        {
          label: "Apply Suggestions",
          action: () => console.log("Applying AI suggestions")
        },
        {
          label: "Show Alternatives", 
          action: () => console.log("Showing alternative schedules")
        },
        {
          label: "Generate Full Schedule",
          action: () => console.log("Generating complete day schedule")
        }
      ];
    }

    return undefined;
  }

  async generateScheduleCandidates(request: SchedulingRequest): Promise<SchedulingResponse> {
    const prompt = this.buildScheduleGenerationPrompt(request);
    
    const messages: GeminiMessage[] = [
      {
        role: "user",
        parts: [{ text: prompt }]
      }
    ];

    try {
      const structuredResponse = await this.makeStructuredRequest(messages);
      
      if (structuredResponse.structured === false) {
        return {
          response: structuredResponse.response,
          explainability: "Generated conversational response due to parsing issues"
        };
      }

      // Parse the structured response into schedule candidates
      const candidates = this.parseScheduleCandidates(structuredResponse);
      
      return {
        response: structuredResponse.explanation || "Generated optimized schedule candidates",
        suggestedSchedule: candidates,
        explainability: structuredResponse.reasoning || "Applied priority-based scheduling algorithm with conflict avoidance",
        actions: [
          {
            label: "Apply Best Schedule",
            action: () => console.log("Applying best schedule candidate")
          },
          {
            label: "Show All Options",
            action: () => console.log("Showing all schedule alternatives")
          },
          {
            label: "Customize Further",
            action: () => console.log("Opening customization options")
          }
        ]
      };
    } catch (error) {
      console.error("Error generating schedule candidates:", error);
      return {
        response: "I encountered an issue generating your schedule. Let me provide some general recommendations instead.",
        explainability: "Fallback response due to generation error"
      };
    }
  }

  private buildScheduleGenerationPrompt(request: SchedulingRequest): string {
    const basePrompt = this.buildSystemPrompt(request);
    
    return `${basePrompt}

TASK: Generate 3 optimized schedule candidates for today as structured JSON.

REQUIRED OUTPUT FORMAT:
\`\`\`json
{
  "explanation": "Brief explanation of the scheduling approach",
  "reasoning": "Why these schedules were chosen",
  "candidates": [
    {
      "user_id": "user_1",
      "date": "${new Date().toISOString().split('T')[0]}",
      "timezone": "${request.preferences?.timezone || 'Asia/Kolkata'}",
      "tasks": [
        {
          "task_id": "unique_id",
          "name": "Task Name",
          "type": "fixed|flexible|incomplete|recurring",
          "start": "2025-09-16T09:00:00+05:30",
          "duration_minutes": 90,
          "end": "2025-09-16T10:30:00+05:30",
          "priority_score": 85,
          "targets": ["target1", "target2"],
          "fixed": false,
          "notes": "Additional info",
          "source": "sheet|user|agent",
          "reschedule_policy": "push|split|drop",
          "metadata": {
            "estimated_effort": 7,
            "progress_percent": 0
          }
        }
      ],
      "generated_at": "${new Date().toISOString()}",
      "agent_version": "1.0",
      "explainability": "Brief explanation of this specific schedule",
      "priority_score": 85
    }
  ]
}
\`\`\`

CONSTRAINTS:
- All fixed tasks (classes) must be preserved exactly
- No overlapping tasks
- Include buffer time between tasks
- Respect working hours unless explicitly overridden
- Prioritize incomplete tasks from previous days
- Balance productivity with breaks

Generate realistic, actionable schedules that the user can actually follow.`;
  }

  private parseScheduleCandidates(response: any): ScheduleCandidate[] {
    try {
      if (response.candidates && Array.isArray(response.candidates)) {
        return response.candidates.map((candidate: any) => ({
          user_id: candidate.user_id || "user_1",
          date: candidate.date || new Date().toISOString().split('T')[0],
          timezone: candidate.timezone || "Asia/Kolkata",
          tasks: candidate.tasks || [],
          generated_at: candidate.generated_at || new Date().toISOString(),
          agent_version: candidate.agent_version || "1.0",
          explainability: candidate.explainability || "AI-generated schedule",
          priority_score: candidate.priority_score || 75
        }));
      }
      return [];
    } catch (error) {
      console.error("Error parsing schedule candidates:", error);
      return [];
    }
  }

  async generateOptimalSchedule(
    courseSchedule: CourseScheduleItem[],
    priorityTasks: PriorityTask[],
    incompleteTasks: IncompleteTask[],
    preferences?: any
  ): Promise<ScheduleCandidate[]> {
    const request: SchedulingRequest = {
      message: "Generate optimal schedule for today",
      currentTasks: [],
      courseSchedule,
      priorityTasks,
      incompleteTasks,
      preferences
    };

    const response = await this.generateScheduleCandidates(request);
    return response.suggestedSchedule || [];
  }

  // Advanced AI methods for scheduling
  async processScheduleModification(message: string, currentSchedule: any): Promise<any> {
    const prompt = `
You are an AI scheduling assistant. The user wants to modify their current schedule with this request: "${message}"

Current Schedule:
${JSON.stringify(currentSchedule, null, 2)}

Analyze the request and provide a modification plan with:
1. What needs to be changed
2. Which tasks are affected
3. Suggested time slots for new/modified tasks
4. Conflicts to resolve

Return JSON format:
{
  "action": "add|modify|remove|reschedule",
  "affectedTasks": [],
  "newTask": {...},
  "suggestions": []
}
`;

    try {
      const response = await this.makeRequest([{
        role: "user",
        parts: [{ text: prompt }]
      }]);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error processing schedule modification:', error);
      return {
        action: 'add',
        affectedTasks: [],
        newTask: { name: message, duration_minutes: 60 },
        suggestions: [`Add "${message}" to the schedule`]
      };
    }
  }

  async generateSchedule(prompt: string): Promise<any> {
    try {
      const response = await this.makeRequest([{
        role: "user",
        parts: [{ text: prompt }]
      }]);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating schedule:', error);
      return {
        candidates: [{
          id: 'fallback',
          schedule: {
            tasks: [],
            explainability: 'AI service unavailable, using fallback'
          },
          score: 0,
          explanation: 'Fallback schedule generated due to AI service error',
          conflicts: []
        }]
      };
    }
  }

  async generateText(prompt: string): Promise<string> {
    return await this.makeRequest([{
      role: "user",
      parts: [{ text: prompt }]
    }]);
  }
}

export const geminiService = new GeminiAIService();