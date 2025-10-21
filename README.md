# 🤖 AI Scheduler - Intelligent Task Management System

> **Built with Gemini 2.5 Flash** - An autonomous scheduling agent that integrates with Google Sheets, Calendar, and Tasks to create optimized daily schedules with real-time chat/voice interaction.

![AI Scheduler Dashboard](https://via.placeholder.com/800x400/6366f1/ffffff?text=AI+Scheduler+Dashboard)

## 🚀 Features

### Core Functionality
- **🧠 AI-Powered Scheduling**: Gemini 2.5 Flash integration for intelligent schedule optimization
- **📊 Google Sheets Integration**: Connects to Course Schedule, Priority Tasks, and Incomplete Tasks sheets
- **📅 Calendar Sync**: Integrates with Google Calendar and Google Tasks API
- **💬 Chat Interface**: Text and voice input for real-time schedule modifications
- **🔔 Smart Notifications**: Task start/end notifications with completion tracking
- **📈 Progress Analytics**: Comprehensive dashboard with efficiency metrics

### Advanced Capabilities
- **⚡ Schedule Generation**: Creates multiple optimized schedule candidates
- **🔄 Task Lifecycle Management**: Handles task completion, partial completion, and rescheduling
- **🎯 Priority-Based Optimization**: Respects fixed constraints while optimizing flexible tasks
- **📋 Conflict Detection**: Identifies and resolves scheduling conflicts automatically
- **🌙 Dark/Light Mode**: Beautiful purple-themed responsive design

## 🔧 Technical Architecture

### Backend Services
- **Gemini AI Service**: Advanced prompt engineering for schedule optimization
- **Google Sheets Service**: CRUD operations for task and schedule data
- **Google Calendar Service**: Calendar event management and conflict detection
- **Notification Service**: Task lifecycle notifications and browser notifications

### Frontend Components
- **Dashboard Layout**: Main application interface with tabs and stats
- **AI Chat Interface**: Conversational scheduling agent
- **Task Cards**: Interactive task management with reschedule capabilities
- **Schedule Timeline**: Visual representation of daily schedule
- **Notification Center**: Real-time alerts and task reminders

## 📋 Prerequisites

- Node.js 18+ and npm/bun
- Google API credentials (Sheets, Calendar, Tasks APIs)
- Modern browser with notification support

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aj1359/AI-scheduler.git
   cd chrono-assist-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure API Keys**
   The app uses these Google APIs:
   - **Gemini API**: `AIzaSyBmrMvq1Q5LfbMmOLBxmt4IsoVFd4be6Jg`
   - **Google Sheets API**: `AIzaSyAT4OOs0sQdHCM718SL0Lz-UDkIoYbcp_U`
   - **Google Tasks API**: Same as Sheets API

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

## 📊 Google Sheets Setup

### Sheet Structure
Your Google Sheets document should have three sheets:

#### 1. Course Schedule (Fixed Events)
| Column | Description | Example |
|--------|-------------|---------|
| A | Day of Week | Monday |
| B | Time | 09:00-10:30 |
| C | Course Name | Differential Equations |
| D | Location | Room 101 |
| E | Instructor | Dr. Smith |

#### 2. Priority Tasks (Flexible Tasks)
| Column | Description | Example |
|--------|-------------|---------|
| A | Task ID | priority_001 |
| B | Task Name | Study Algorithms |
| C | Priority | high |
| D | Duration (min) | 120 |
| E | Due Date | 2025-09-20 |
| F | Targets | exam_prep, skills |
| G | Notes | Focus on sorting |

#### 3. Incomplete Tasks (Carryover Tasks)
| Column | Description | Example |
|--------|-------------|---------|
| A | Task ID | incomplete_001 |
| B | Task Name | React Project |
| C | Original Duration | 180 |
| D | Remaining Duration | 90 |
| E | Priority | medium |
| F | Source Date | 2025-09-15 |
| G | Progress (%) | 50 |
| H | Notes | Half complete |

## 🤖 AI Agent Capabilities

### Schedule Generation
```
User: "Generate my schedule for today"
Agent: Analyzes fixed courses, priority tasks, and incomplete work
→ Creates 3 optimized schedule candidates
→ Considers priorities, energy levels, and break times
→ Provides explainability for scheduling decisions
```

### Live Rescheduling
```
User: "I need to go to a party at 6pm"
Agent: Identifies conflicts with existing tasks
→ Proposes rescheduling options
→ Minimizes disruption to high-priority goals
→ Asks for confirmation before applying changes
```

### Task Lifecycle Management
```
Task Start: Browser notification + email reminder
Task End: Completion prompt (completed/partial/not done)
Incomplete: Automatically moves to next day's schedule
Progress: Tracks efficiency and goal completion
```

## 📈 Dashboard Features

### Smart Stats
- **Today's Progress**: Real-time completion percentage
- **Weekly Goals**: Long-term target tracking
- **Focus Time**: Total productive time logged
- **Efficiency Score**: AI-calculated productivity metric
- **Priority Score**: Weighted completion by task importance

### Interactive Elements
- **Task Cards**: Complete, edit, or reschedule tasks
- **Schedule Timeline**: Visual drag-and-drop interface
- **Chat Interface**: Natural language scheduling commands
- **Notification Center**: Task alerts and system updates

## 🔔 Notification System

### Automated Alerts
- **5 minutes before task start**: "Math Class starting soon"
- **At task end**: "How did your study session go?"
- **Schedule changes**: "Your schedule has been optimized"
- **Conflict detection**: "Potential scheduling conflict found"

### Completion Tracking
- **Completed**: Marks done, logs efficiency
- **Partially Completed**: Calculates remaining work
- **Not Completed**: Reschedules for next available slot

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradient (`hsl(259, 100%, 50%)`)
- **Secondary**: Light purple (`hsl(270, 5%, 95%)`)
- **Accent**: Purple glow (`hsl(259, 100%, 75%)`)
- **Background**: Subtle gradients with glass morphism

### Typography
- **Headings**: Inter (geometric precision)
- **Body**: Inter (high readability)
- **Monospace**: JetBrains Mono (code/data)

## 🚀 Deployment

### Production Build
```bash
npm run build
bun run build
```

### Environment Variables
```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_SHEETS_API_KEY=your_sheets_key
VITE_GOOGLE_CALENDAR_API_KEY=your_calendar_key
```

### OAuth2 Setup (Required for Write Operations)
For full Google integration:
1. Create Google Cloud Console project
2. Enable Sheets, Calendar, and Tasks APIs
3. Set up OAuth2 credentials
4. Configure authorized domains

## 📚 Usage Examples

### Generate Daily Schedule
```
User: "Create my optimal schedule for today"
AI: → Analyzes all data sources
    → Generates 3 schedule candidates
    → Explains reasoning for each option
    → Allows user to select or modify
```

### Handle Urgent Changes
```
User: "Emergency meeting at 2pm for 1 hour"
AI: → Identifies affected tasks
    → Proposes minimal-disruption rescheduling
    → Updates calendar and notifications
    → Confirms changes with user
```

### Track Progress
```
Notification: "Study session completed?"
User: "Partially - need 30 more minutes"
AI: → Logs progress (75% complete)
    → Schedules 30min followup
    → Updates efficiency metrics
```

## 🔧 Technical Implementation

### Core Architecture
```typescript
// Main scheduling flow
1. Data Ingestion: Google Sheets → Local State
2. AI Processing: Gemini 2.5 Flash → Schedule Candidates
3. Conflict Resolution: Calendar API → Optimized Schedule
4. User Interaction: Chat Interface → Real-time Updates
5. Task Lifecycle: Notifications → Completion Tracking
```

### Key Services
- **GeminiAIService**: Processes natural language requests and generates structured schedules
- **GoogleSheetsService**: Handles CRUD operations for course schedules and tasks
- **GoogleCalendarService**: Manages calendar events and conflict detection
- **NotificationService**: Orchestrates task start/end notifications and completion tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/Aj1359/ai-scheduler/wiki)
- **Issues**: [GitHub Issues](https://github.com/Aj1359/ai-scheduler/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Aj1359/ai-scheduler/discussions)

---

**Built with ❤️ by the AI Scheduler Team**

*Transform your productivity with intelligent scheduling - because your time deserves better management.*
