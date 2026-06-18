# TaskFlow API

TaskFlow API is a learning-focused task management backend built with NestJS, TypeScript, PostgreSQL, Prisma, Docker, JWT authentication, and BullMQ. The project is designed as a practical playground for building real backend features step by step: authentication, CRUD operations, permissions, file uploads, task collaboration, activity tracking, background jobs, exports, templates, and time tracking.

## Tech Stack

- Node.js + TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Bull Board
- Docker Compose
- JWT authentication
- Swagger / OpenAPI
- SendGrid for password reset emails
- Multer for local file uploads
- ESLint + Prettier

## Features

### Authentication

- User registration and login
- JWT access tokens
- Refresh tokens stored as hashed values
- Logout and logout from all devices
- Forgot password and reset password flow
- Password reset emails sent through BullMQ + SendGrid

### Users

- Get current user profile
- Update profile
- Change password
- Upload, fetch, and delete user avatar

### Workspaces

- Workspace CRUD
- Workspace ownership
- Workspace members
- Member roles: `OWNER`, `ADMIN`, `MEMBER`
- Add, update, and remove workspace members

### Projects

- Project CRUD inside workspaces
- Pagination and search
- Workspace-based access checks

### Tasks

- Task CRUD inside projects
- Status, priority, and type fields
- Start date and due date
- Assignee management
- Labels
- Comments with mentions
- Attachments
- Checklist items
- Watchers
- Milestones
- Saved task filters
- Archive / unarchive
- Flag / unflag
- Clone task
- Create task from template
- Original estimate, remaining estimate, and time spent
- Worklogs for time tracking
- Activity log for task changes

### Task Templates

- Workspace-level task template CRUD
- Template labels, type, priority, title, and description
- Search, sort, and pagination for template lists
- Duplicate templates with unique copy names
- Bulk delete templates
- Usage tracking with `usageCount` and `lastUsedAt`
- Create project tasks from workspace templates

### Task Exports

- Export project tasks to CSV through BullMQ
- Export all tasks, filtered tasks, or selected task IDs
- Store export status in the database
- Track export progress from `0` to `100`
- Cancel pending or active exports
- Cooperative cancellation for already running jobs
- Retry failed or cancelled exports
- Download completed CSV files

### Notifications

- In-app notifications
- Unread notification count
- Mark one or all notifications as read
- Notifications for task assignment, watcher added, comments, mentions, status changes, and reminders
- Notification creation processed through BullMQ

### Task Reminders

- Create personal task reminders
- List reminders for a task
- Update reminder time
- Delete pending reminders
- Delayed BullMQ jobs for scheduled reminders
- Automatic reminder notifications when jobs are processed

### Background Jobs

- Redis-backed BullMQ queues
- `notifications` queue for in-app notifications and task reminders
- `email` queue for password reset emails
- `task-export` queue for CSV exports
- Retry attempts with exponential backoff
- Queue lifecycle logs in processors
- Configurable worker concurrency for export jobs
- Bull Board dashboard for local queue inspection

### Files

- Local avatar uploads
- Local task attachment uploads
- Generated CSV export files
- File size and file type validation

## Project Structure

```text
src/
  auth/                 Authentication, JWT strategies, guards, decorators
  users/                User profile, password, avatars
  workspaces/           Workspace CRUD and members
  projects/             Project CRUD
  tasks/                Task CRUD and task-specific actions
  task-templates/       Workspace task templates
  comments/             Task comments and mentions
  attachments/          Task attachments
  labels/               Workspace labels and task labels
  checklist-items/      Task checklist items
  task-watchers/        Task watchers
  milestones/           Project milestones
  saved-task-filters/   Saved filters for task lists
  worklogs/             Task time tracking
  task-reminders/       Scheduled task reminders
  task-exports/         CSV task exports
  notifications/        In-app notifications
  queues/               BullMQ queue modules, processors, and job config
  task-activity/        Task activity logs
  email/                Email provider integration
  prisma/               Prisma service and module
  common/               Shared DTOs, types, helpers
prisma/
  schema.prisma         Database schema
  migrations/           Prisma migrations
uploads/
  avatars/              Local avatar files
  attachments/          Local task attachment files
  exports/tasks/        Generated task CSV exports
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd taskflow-api
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Update values if needed:

```env
APP_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
CORS_ORIGINS="http://localhost:3001,http://127.0.0.1:3001"

DATABASE_URL="postgresql://taskflow_user:taskflow_password@localhost:5432/taskflow_db?schema=public"

JWT_SECRET="change-me"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="refresh-secret-change-me"
JWT_REFRESH_EXPIRES_IN="7d"

JWT_RESET_PASSWORD_SECRET="reset-password-secret-change-me"
JWT_RESET_PASSWORD_EXPIRES_IN="30m"

SENDGRID_API_KEY="change-me"
SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
SENDGRID_FROM_NAME="TaskFlow"
SENDGRID_PASSWORD_RESET_TEMPLATE_ID="d-your-template-id"

REDIS_HOST="localhost"
REDIS_PORT="6379"
```

Do not commit real secrets to Git.

### 4. Start PostgreSQL and Redis with Docker

```bash
docker compose up -d
```

This starts:

- PostgreSQL on port `5432`
- Redis on port `6379`

### 5. Run database migrations

```bash
npx prisma migrate dev
```

### 6. Generate Prisma client

```bash
npx prisma generate
```

### 7. Start the API

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

Swagger documentation will be available at:

```text
http://localhost:3000/api
```

Bull Board will be available locally at:

```text
http://localhost:3000/admin/queues
```

## Useful Commands

```bash
# Start the API in watch mode
npm run start:dev

# Start PostgreSQL and Redis
docker compose up -d

# Build the project
npm run build

# Run linting
npm run lint

# Format source files
npm run format

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Open Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Regenerate Prisma client
npx prisma generate
```

## Docker

The project includes a `docker-compose.yml` file for local PostgreSQL and Redis:

```bash
docker compose up -d
```

To stop containers:

```bash
docker compose down
```

To stop containers and remove the local database volume:

```bash
docker compose down -v
```

## API Documentation

Swagger is enabled in development and can be opened at:

```text
http://localhost:3000/api
```

Most protected endpoints require a Bearer token:

```text
Authorization: Bearer <access_token>
```

## Queue Dashboard

Bull Board is available locally at:

```text
http://localhost:3000/admin/queues
```

It can be used to inspect BullMQ jobs:

- waiting
- delayed
- active
- completed
- failed
- retried jobs
- job payloads and errors
- job progress

The dashboard is currently intended for local development only and should be protected or disabled before production deployment.

## Main API Areas

- `/auth` - authentication and password reset
- `/users` - user profile and avatars
- `/workspaces` - workspaces and workspace members
- `/workspaces/:workspaceId/projects` - workspace projects
- `/workspaces/:workspaceId/task-templates` - workspace task templates
- `/projects/:projectId/tasks` - tasks and create-from-template flow
- `/projects/:projectId/task-exports` - CSV task exports
- `/projects/:projectId/labels` - labels
- `/projects/:projectId/milestones` - milestones
- `/projects/:projectId/saved-filters` - saved task filters
- `/tasks/:taskId/comments` - task comments
- `/tasks/:taskId/reminders` - task reminders
- `/projects/:projectId/tasks/:taskId/attachments` - task attachments
- `/projects/:projectId/tasks/:taskId/checklist-items` - task checklist items
- `/projects/:projectId/tasks/:taskId/watchers` - task watchers
- `/projects/:projectId/tasks/:taskId/worklogs` - task worklogs
- `/projects/:projectId/tasks/:taskId/activity` - task activity log
- `/notifications` - in-app notifications

## Task Template Flow

Task templates are workspace-level presets used to create tasks faster and more consistently.

```text
POST /workspaces/:workspaceId/task-templates
        -> create reusable template with labels/type/priority/description

POST /projects/:projectId/tasks/from-template
        -> load template from the same workspace
        -> create task with template fields and labels
        -> create TASK_CREATED activity
        -> increment template usageCount and lastUsedAt
```

Template management supports:

- list with search, sort, and pagination
- duplicate template
- bulk delete templates
- create task from template
- usage tracking

## Task Export Flow

Task exports are asynchronous. The API creates an export record and queues a BullMQ job; the worker generates the CSV in the background.

```text
POST /projects/:projectId/task-exports
        -> TaskExportsService.create()
        -> task_exports row with PENDING status
        -> TaskExportQueueService.addExportProjectTasksCsvJob(...)
        -> Redis / BullMQ task-export queue
        -> TaskExportQueueProcessor
        -> TaskExportsService.generateProjectTasksCsv(...)
        -> CSV file in uploads/exports/tasks
        -> task_exports status COMPLETED or FAILED
```

Supported export inputs include:

```json
{
  "taskIds": ["task-id-1", "task-id-2"],
  "statuses": ["TODO", "IN_PROGRESS"],
  "priorities": ["HIGH"],
  "types": ["BUG", "FEATURE"],
  "assigneeIds": ["user-id"],
  "labelIds": ["label-id"],
  "milestoneIds": ["milestone-id"],
  "withoutAssignee": false,
  "withoutMilestone": false,
  "includeArchived": false,
  "search": "auth"
}
```

Export lifecycle:

```text
PENDING -> PROCESSING -> COMPLETED
PENDING -> PROCESSING -> FAILED
PENDING -> CANCELLED
PROCESSING -> CANCELLED
FAILED/CANCELLED -> retry -> PENDING
```

## Background Job Flow

TaskFlow currently uses BullMQ for three main flows.

### Notification jobs

```text
Tasks / Comments / Watchers / Reminders
        -> NotificationsQueueService
        -> Redis / BullMQ notifications queue
        -> NotificationsQueueProcessor
        -> notifications table
```

### Email jobs

```text
Auth forgot-password
        -> EmailQueueService
        -> Redis / BullMQ email queue
        -> EmailQueueProcessor
        -> SendGrid
```

### Task export jobs

```text
Task export request
        -> TaskExportQueueService
        -> Redis / BullMQ task-export queue
        -> TaskExportQueueProcessor
        -> CSV file + task_exports status update
```

## Development Notes

- Feature-based NestJS modules
- DTO validation with `class-validator`
- Global validation pipe with whitelist enabled
- Prisma migrations for database changes
- Hashed passwords and refresh tokens
- Role-based access checks for workspace resources
- Transactions for multi-step database operations
- BullMQ queues for background jobs
- Delayed jobs for task reminders
- CSV exports with progress, cancellation, retry, and worker concurrency
- Workspace task templates with duplication, bulk actions, and usage tracking
- Swagger decorators for API documentation
- Local file storage abstraction that can later be replaced with S3 or another storage provider

## Roadmap

Planned topics for further practice:

- Bull Board protection or production disable switch
- RabbitMQ for async messaging
- Kafka basics in a separate flow
- CI/CD pipeline
- Dockerizing the API itself
- Production-ready deployment setup
- More tests for services and controllers
- Outbox pattern for reliable event processing

## License

This project is currently unlicensed.