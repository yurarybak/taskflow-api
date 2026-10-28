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
  workspace-access/     Shared workspace/project/task membership checks
  config/               Environment variable validation
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

Optional variables:

```env
NODE_ENV="development"          # development | production | test
PORT="3000"
BULL_BOARD_USERNAME="admin"     # set both to protect /admin/queues with Basic auth
BULL_BOARD_PASSWORD="change-me"
```

The environment is validated on startup (`src/config/env.validation.ts`). If a variable is missing or malformed, the API refuses to start and lists every problem, for example:

```text
Error: Invalid environment configuration:
  - JWT_REFRESH_EXPIRES_IN must look like 30m, 12h or 7d
  - REDIS_PORT must be an integer number
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

# Build the project and run the compiled app
npm run build
npm run start:prod

# Type-check without emitting
npx tsc --noEmit

# Run linting
npm run lint

# Format source files
npm run format

# Run tests
npm run test

# Run a single test file or tests matching a name
npx jest src/tasks/tasks.service.spec.ts
npx jest -t "records the status change"

# Run e2e tests
npm run test:e2e

# Open Prisma Studio
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Regenerate Prisma client
npx prisma generate
```

### Git hooks

`npm install` installs Husky hooks. The pre-commit hook runs ESLint (with Prettier) on staged `.ts` files via lint-staged and then the unit test suite. A failing lint or test blocks the commit.

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

The raw OpenAPI document is served at `http://localhost:3000/api-json`.

## Request Examples

The examples use `curl` against a local API. Route parameters are UUIDs; anything else is rejected with `400`.

### Register and log in

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ann@example.com","password":"Password123!","firstName":"Ann","lastName":"Smith"}'
# 201 {"accessToken":"...","refreshToken":"...","user":{"id":"...","email":"ann@example.com",...}}

curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ann@example.com","password":"Password123!"}'
# 200 {"accessToken":"...","refreshToken":"...","user":{...}}

export TOKEN="<accessToken from the response>"
```

Refresh the access token when it expires:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H 'Content-Type: application/json' \
  -d '{"refreshToken":"<refreshToken>"}'
# 200 {"accessToken":"...","refreshToken":"...","user":{...}}
```

### Create a workspace, project and task

```bash
curl -X POST http://localhost:3000/workspaces \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Acme","description":"Product team"}'
# 201 {"id":"<workspaceId>","name":"Acme","description":"Product team","ownerId":"...",...}

curl -X POST http://localhost:3000/workspaces/<workspaceId>/projects \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Website"}'
# 201 {"id":"<projectId>","name":"Website","workspaceId":"<workspaceId>",...}

curl -X POST http://localhost:3000/projects/<projectId>/tasks \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Fix login redirect","priority":"HIGH","type":"BUG"}'
# 201 {"id":"<taskId>","title":"Fix login redirect","status":"TODO","priority":"HIGH","type":"BUG",...}
```

### List tasks with filters and pagination

Filters accept comma-separated values. Unknown query parameters are rejected with `400`.

```bash
curl "http://localhost:3000/projects/<projectId>/tasks?page=1&limit=10&statuses=TODO,IN_PROGRESS&priorities=HIGH&search=login" \
  -H "Authorization: Bearer $TOKEN"
# 200 {"data":[{...}],"meta":{"total":1,"page":1,"limit":10,"totalPages":1}}
```

### Update a task, comment on it, archive it

```bash
curl -X PATCH http://localhost:3000/projects/<projectId>/tasks/<taskId> \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"status":"IN_PROGRESS"}'
# 200 — also writes a STATUS_CHANGED activity entry and notifies task watchers

curl -X POST http://localhost:3000/tasks/<taskId>/comments \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"content":"Reproduced on Safari, @[<userId>] can you take a look?"}'
# 201 — users mentioned as @[<userId>] receive a notification

curl -X PATCH http://localhost:3000/projects/<projectId>/tasks/<taskId>/archive \
  -H "Authorization: Bearer $TOKEN"
# 200 {"id":"<taskId>","archivedAt":"2026-01-01T10:00:00.000Z",...}
```

### Export tasks to CSV

```bash
curl -X POST http://localhost:3000/projects/<projectId>/task-exports \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"statuses":["TODO"]}'
# 201 {"id":"<exportId>","status":"PENDING","progress":0,...}

curl http://localhost:3000/projects/<projectId>/task-exports/<exportId> \
  -H "Authorization: Bearer $TOKEN"
# 200 {"id":"<exportId>","status":"COMPLETED","progress":100,...}

curl -OJ http://localhost:3000/projects/<projectId>/task-exports/<exportId>/download \
  -H "Authorization: Bearer $TOKEN"
# 200 text/csv
```

### Error responses

Validation errors list every failed constraint:

```json
{
  "message": ["title must be longer than or equal to 2 characters"],
  "error": "Bad Request",
  "statusCode": 400
}
```

Resources outside the user's workspaces return `404` rather than `403`, so their existence is not revealed.

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

Access depends on configuration:

| `BULL_BOARD_USERNAME` / `BULL_BOARD_PASSWORD` | `NODE_ENV`     | Result                       |
| --------------------------------------------- | -------------- | ---------------------------- |
| set                                           | any            | HTTP Basic auth required     |
| not set                                       | `production`   | dashboard hidden (`404`)     |
| not set                                       | anything else  | open, for local development  |

## Security

- **Input validation** — a global `ValidationPipe` with `whitelist` and `forbidNonWhitelisted` rejects unknown fields; every route parameter is checked with `ParseUUIDPipe`.
- **HTTP headers** — Helmet sets CSP, HSTS, `X-Content-Type-Options` and related headers. The `upgrade-insecure-requests` directive is disabled so Swagger UI and Bull Board work over plain HTTP.
- **Rate limiting** — `@nestjs/throttler` allows 100 requests per minute per client. Public auth endpoints are stricter (per minute): `register` and `login` 5, `reset-password` 5, `refresh` 10, `forgot-password` 3. Exceeding a limit returns `429`. Limits are kept in memory, so they apply per API instance.
- **CSRF** — the API authenticates with Bearer tokens sent in the `Authorization` header and does not use cookies, so browsers never attach credentials automatically and classic CSRF does not apply. Revisit this if tokens move to cookies (for example an httpOnly refresh-token cookie).
- **XSS** — responses are JSON only, served with a restrictive CSP and `nosniff`. Clients must render user content as text (React does this by default).
- **CORS** — only origins listed in `CORS_ORIGINS` are allowed.
- **Configuration** — secrets come from `.env` through `ConfigModule` and are validated on startup.

## Main API Areas

- `/auth` - authentication and password reset
- `/users` - user profile and avatars
- `/workspaces` - workspaces and workspace members
- `/workspaces/:workspaceId/projects` - workspace projects
- `/workspaces/:workspaceId/task-templates` - workspace task templates
- `/projects/:projectId/tasks` - tasks and create-from-template flow
- `/projects/:projectId/task-exports` - CSV task exports
- `/workspace/:workspaceId/labels` - workspace labels (note the singular `workspace`)
- `/projects/:projectId/milestones` - milestones
- `/projects/:projectId/saved-filters` - saved task filters
- `/tasks/:taskId/comments` - task comments
- `/tasks/:taskId/reminders` - task reminders
- `/tasks/:taskId/attachments` - task attachments
- `/tasks/:taskId/checklist-items` - task checklist items
- `/tasks/:taskId/watchers` - task watchers
- `/tasks/:taskId/activity` - task activity log
- `/projects/:projectId/tasks/:taskId/worklogs` - task worklogs
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
- Role-based access checks for workspace resources, centralized in `WorkspaceAccessService`
- TypeScript `strict` mode; ESLint requires explicit return types and forbids `any`
- Husky pre-commit hook runs lint and unit tests
- Winston logging: readable console output in development, JSON lines with `NODE_ENV=production`; uncaught exceptions and unhandled rejections are logged before the process exits
- Transactions for multi-step database operations
- BullMQ queues for background jobs
- Delayed jobs for task reminders
- CSV exports with progress, cancellation, retry, and worker concurrency
- Workspace task templates with duplication, bulk actions, and usage tracking
- Swagger decorators for API documentation
- Local file storage abstraction that can later be replaced with S3 or another storage provider

## Roadmap

Planned topics for further practice:

- RabbitMQ for async messaging
- Kafka basics in a separate flow
- CI/CD pipeline
- Dockerizing the API itself
- Production-ready deployment setup
- More tests for services and controllers
- Outbox pattern for reliable event processing

## License

This project is currently unlicensed.