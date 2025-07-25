# CheatSheet Supabase Integration Guide

This guide explains how to set up and configure Supabase for the CheatSheet project, including Canvas LMS integration and agent session management.

## 🚀 Quick Setup

### Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Node.js 18+**: Ensure you have Node.js installed
3. **Supabase CLI**: Will be installed automatically by the setup script

### Automated Setup

1. **Create Supabase Project**:
   - Go to [app.supabase.com](https://app.supabase.com)
   - Click "New project"
   - Choose organization and enter project details
   - Wait for project initialization

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   
   Update your `.env` file with Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Run Setup Script**:
   ```bash
   cd CheatSheet/scripts
   ./setup-supabase.sh
   ```

That's it! The script will automatically:
- Install Supabase CLI if needed
- Link your project
- Apply all database migrations
- Set up Row Level Security
- Configure all functions and triggers

## 📊 Database Schema

### Core Tables

#### `profiles`
User profile information with Canvas integration:
- `id` (UUID, PK): References auth.users(id)
- `email` (TEXT): User's email address
- `display_name` (TEXT): User's display name
- `canvas_domain` (TEXT): Canvas LMS domain
- `encrypted_canvas_token` (TEXT): Encrypted Canvas access token

#### `courses`
Canvas course data:
- `id` (TEXT, PK): Canvas course ID
- `user_id` (UUID, FK): Owner of the course data
- `name` (TEXT): Course name
- `code` (TEXT): Course code (e.g., "CS 101")
- `term` (TEXT): Academic term
- `enrollment_state` (TEXT): active/completed/etc.

#### `assignments`
Canvas assignment data:
- `id` (TEXT, PK): Canvas assignment ID
- `course_id` (TEXT, FK): References courses(id)
- `name` (TEXT): Assignment name
- `due_at` (TIMESTAMPTZ): Due date
- `points_possible` (DECIMAL): Maximum points
- `submission_types` (TEXT[]): Array of submission types

#### `agent_sessions`
AI agent session tracking:
- `id` (UUID, PK): Session identifier
- `user_id` (UUID, FK): Session owner
- `assignment_id` (TEXT): Related assignment
- `status` (TEXT): planning/executing/completed/etc.
- `progress` (INTEGER): Completion percentage
- `browser_url` (TEXT): Current browser URL
- `document_content` (TEXT): Generated document

#### `agent_messages`
Chat history for agent sessions:
- `session_id` (UUID, FK): Related session
- `message_type` (TEXT): user/agent/system/tool_call
- `content` (TEXT): Message content
- `tool_name` (TEXT): Tool used (if applicable)

### Security (RLS)

All tables use Row Level Security (RLS) with policies ensuring:
- Users can only access their own data
- Proper tenant isolation
- Secure Canvas credential storage

## 🔧 API Functions

### Canvas LMS Functions

#### `sync_canvas_courses(user_id, courses_data)`
Syncs Canvas course data for a user.

```sql
SELECT * FROM sync_canvas_courses(
  auth.uid(),
  '[{"id": "123", "name": "Intro to CS", "course_code": "CS101"}]'::jsonb
);
```

#### `get_user_courses_with_assignments(user_id)`
Gets user's courses with assignment counts.

```sql
SELECT * FROM get_user_courses_with_assignments(auth.uid());
```

#### `get_course_assignments(user_id, course_id, filter)`
Gets assignments for a course with filtering.

```sql
SELECT * FROM get_course_assignments(auth.uid(), '123', 'upcoming');
```

### Agent Session Functions

#### `create_agent_session(user_id, assignment_id, assignment_name, task_type)`
Creates a new agent session.

```sql
SELECT * FROM create_agent_session(
  auth.uid(),
  'assignment_123',
  'Research Paper',
  'research'
);
```

#### `update_agent_session(session_id, user_id, ...updates)`
Updates session status and data.

```sql
SELECT update_agent_session(
  session_id,
  auth.uid(),
  'executing'::text,  -- status
  50::integer,        -- progress
  'https://example.com'::text  -- browser_url
);
```

#### `add_agent_message(session_id, user_id, type, content, tool_name, metadata)`
Adds a message to the session chat.

```sql
SELECT add_agent_message(
  session_id,
  auth.uid(),
  'user',
  'Hello agent!',
  null,
  '{}'::jsonb
);
```

## 🔄 Real-time Features

### Subscriptions

The app automatically subscribes to real-time updates for:

1. **Agent Session Updates**: Status, progress, browser navigation
2. **New Agent Messages**: Real-time chat updates
3. **Course/Assignment Changes**: Canvas data updates

### Example Usage

```typescript
import { realtimeService } from '@/lib/supabase/services';

// Subscribe to agent session updates
const subscription = realtimeService.subscribeToAgentSession(
  sessionId,
  (payload) => {
    console.log('Session updated:', payload.new);
  }
);

// Cleanup
realtimeService.unsubscribe(subscription);
```

## 🎨 Frontend Integration

### Service Layer

Use the comprehensive service layer for all database operations:

```typescript
import { 
  canvasService, 
  agentService, 
  profileService 
} from '@/lib/supabase/services';

// Get user's courses
const courses = await canvasService.getUserCourses();

// Create agent session
const session = await agentService.createSession(
  assignmentId,
  'Research Paper',
  'research'
);

// Update profile
await profileService.updateProfile({
  display_name: 'John Doe'
});
```

### State Management

The Zustand stores are pre-configured to use Supabase:

```typescript
import { useCanvasStore } from '@/stores/canvasStore';
import { useAgentStore } from '@/stores/agentStore';

// Canvas store
const { courses, fetchCourses } = useCanvasStore();

// Agent store
const { startSession, currentSession } = useAgentStore();
```

## 🔐 Canvas LMS Integration

### Setup

1. **Obtain Canvas API Token**:
   - Go to your Canvas instance
   - Navigate to Account → Settings
   - Scroll to "Approved Integrations"
   - Click "+ New Access Token"
   - Copy the generated token

2. **Configure in App**:
   - Login to CheatSheet
   - Go to Settings
   - Enter your Canvas domain (e.g., "university.instructure.com")
   - Paste your API token
   - Click "Save"

### Security

- Canvas tokens are encrypted before storage
- Stored per-user with RLS protection
- Never logged or exposed in client-side code

### Sync Process

The app automatically syncs:
1. **Courses**: All enrolled courses with metadata
2. **Assignments**: All assignments with due dates and requirements
3. **Submissions**: Submission status and grades

## 🚀 Agent Integration

### Session Lifecycle

1. **Create**: User starts a mission for an assignment
2. **Execute**: Agent works on the task with real-time updates
3. **Track**: Progress, browser activity, and document generation
4. **Complete**: Final document saved to database
5. **Archive**: Session history preserved for review

### Real-time Updates

- **Status Changes**: planning → executing → completed
- **Progress Updates**: 0% → 100% with milestone tracking
- **Browser Activity**: Live URL tracking and screenshots
- **Document Generation**: Real-time content updates
- **Chat Messages**: Bidirectional communication

## 🛠️ Development

### Local Development

1. **Start Supabase** (if using local instance):
   ```bash
   supabase start
   ```

2. **Apply Migrations**:
   ```bash
   supabase db reset
   ```

3. **Generate Types**:
   ```bash
   supabase gen types typescript --local > types/database.types.ts
   ```

### Database Migrations

Add new migrations in `supabase/migrations/`:

```sql
-- 005_new_feature.sql
ALTER TABLE profiles ADD COLUMN new_field TEXT;
```

Apply with:
```bash
supabase db push
```

### Testing

Test database functions:

```sql
-- Test Canvas sync
SELECT * FROM sync_canvas_courses(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  '[{"id": "1", "name": "Test Course"}]'::jsonb
);

-- Test agent session
SELECT * FROM create_agent_session(
  '123e4567-e89b-12d3-a456-426614174000'::uuid,
  'test_assignment',
  'Test Assignment',
  'research'
);
```

## 📊 Monitoring

### Supabase Dashboard

Monitor your project at:
- **Database**: View tables, run queries
- **Auth**: Manage users and sessions
- **Storage**: File uploads (if added)
- **Functions**: Edge function logs
- **Logs**: Real-time application logs

### Useful Queries

```sql
-- Active agent sessions
SELECT 
  s.id,
  s.assignment_name,
  s.status,
  s.progress,
  s.created_at
FROM agent_sessions s
WHERE s.status IN ('planning', 'executing')
ORDER BY s.created_at DESC;

-- User activity summary
SELECT 
  p.email,
  COUNT(DISTINCT c.id) as course_count,
  COUNT(DISTINCT a.id) as assignment_count,
  COUNT(DISTINCT s.id) as session_count
FROM profiles p
LEFT JOIN courses c ON p.id = c.user_id
LEFT JOIN assignments a ON c.id = a.course_id
LEFT JOIN agent_sessions s ON p.id = s.user_id
GROUP BY p.id, p.email;
```

## 🐛 Troubleshooting

### Common Issues

1. **Migration Errors**:
   ```bash
   # Reset and reapply
   supabase db reset
   ```

2. **RLS Policy Issues**:
   ```sql
   -- Check user context
   SELECT auth.uid();
   
   -- Disable RLS temporarily for testing
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

3. **Real-time Not Working**:
   - Check if RLS allows the subscription
   - Verify table has `REPLICA IDENTITY FULL`
   - Check browser network tab for subscription errors

4. **Canvas API Issues**:
   - Verify token has correct permissions
   - Check Canvas domain format (no https://)
   - Ensure Canvas instance allows API access

### Getting Help

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Canvas API Docs**: [canvas.instructure.com/doc/api](https://canvas.instructure.com/doc/api)
- **CheatSheet Issues**: Check the project repository

---

This integration provides a robust, scalable foundation for CheatSheet's academic automation features with enterprise-grade security and real-time capabilities.