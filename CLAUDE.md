# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

TaskFlow API is a learning-focused task management backend: NestJS 11 + TypeScript, PostgreSQL via Prisma 7 (driver adapter `@prisma/adapter-pg`), Redis + BullMQ for background jobs, JWT auth, Swagger. See README.md for the full feature list, endpoint map and `curl` examples.

## Commands

```bash
docker compose up -d            # Postgres :5432 + Redis :6379 (required to boot the app)
cp .env.example .env            # first-time setup; env is validated on startup
npx prisma migrate dev          # apply migrations
npx prisma generate             # generate client into generated/prisma (gitignored, must run after clone / schema change)
npm run start:dev               # watch mode; Swagger at /api, Bull Board at /admin/queues

npm run build                   # output lands in dist/src (generated/ sits outside src)
npm run start:prod              # node dist/src/main
npx tsc --noEmit                # type-check
npm run lint                    # eslint with --fix (Prettier runs through eslint)

npm test                                         # unit tests (*.spec.ts under src/)
npx jest src/tasks/tasks.service.spec.ts         # single test file
npx jest -t "records the status change"          # by test name
npm run test:e2e                                 # test/*.e2e-spec.ts

npx prisma migrate dev --name <migration_name>   # new migration after editing prisma/schema.prisma
```

The Husky pre-commit hook runs `lint-staged` (eslint --fix on staged `.ts`) and `npm test`; a commit fails if either fails.

## Coding standards

- **TypeScript** — `strict: true`. `any` is forbidden (lint error); use `unknown` and narrow. Every function and method has explicit parameter and return types (`explicit-function-return-type` is an error).
- **Return types** — use Prisma model types (`Task`, `Pick<User, ...>`) or the named shapes in `<feature>/types/` (`TaskWithLabels`, `WorkspaceMemberWithUser`, `UserSummary`, `PublicUser`). Never paste an expanded inferred Prisma type.
- **Types folder** — contracts live in `<feature>/types/*.type.ts`. New object shapes use `interface`; `type` is for unions and `Pick`/`Omit` aliases. Existing `type` declarations are left as they are.
- **Entities** — Prisma models from `generated/prisma/client` are the entities; there is no separate entity layer. Import them with `import type`.
- **DTOs** — request DTOs in `dto/`, response DTOs in `dto/responses/`. Every field has `@ApiProperty`/`@ApiPropertyOptional` plus class-validator rules. An optional field (`?` / `@ApiPropertyOptional`) must also have `@IsOptional()`. No JSDoc on DTOs.
- **Swagger** — every controller has `@ApiTags`; every endpoint has `@ApiOperation({ summary })` and typed responses for each status it returns. POST endpoints that perform an action rather than create a resource use `@HttpCode(HttpStatus.OK)` and document `200`. Response DTO class names must be unique app-wide (Swagger keys schemas by class name).
- **Route params** — always `@Param('id', ParseUUIDPipe)`; all ids are UUIDs.
- **Configuration** — read config only through `ConfigService`, never `process.env`. A new variable goes into `src/config/env.validation.ts` and `.env.example`.
- **External APIs** — wrap provider calls, return a typed result and throw a typed error (see `EmailService` → `EmailDeliveryResult` / `EmailDeliveryError`).
- **Logging** — Winston via `nest-winston` (`src/logger/`) replaces Nest's logger in `main.ts`, so use `new Logger(Context.name)` from `@nestjs/common` as usual. Dev output is pretty-printed at `debug`; `NODE_ENV=production` emits JSON at `info`. Pass untrusted values through `sanitizeLogValue` (`src/common/utils/log-sanitize.util.ts`) before logging. `registerFatalErrorLogging` logs uncaught exceptions/unhandled rejections without changing Node's crash behavior. Every request passes `RequestIdMiddleware` (sets `req.id` from `X-Request-Id` or a UUID, echoes it back) and then `LoggingMiddleware`, which writes one `[id] RESPONSE <ip> <email|-> "<METHOD url>" <status> <bytes> rt=<ms>` line per request. Client IP comes from `resolveClientIp` (Incap-Client-IP → X-Forwarded-For → socket) and is for logs only, never for auth. `req.user`/`req.id` types are declared in `src/common/types/express.d.ts`. Which events to log is still being decided; ask before adding new log statements.
- **XSS** — input is deliberately not HTML-sanitized (text like `<Button>` is legitimate in task descriptions); protection relies on CSP, `nosniff`, JSON-only responses and client-side escaping. Don't add `sanitize-html` or similar without asking.
- **Comments** — only for non-obvious business rules.
- **Line endings** — the working tree uses CRLF (`core.autocrlf=true`); `.husky/*` must stay LF. Don't run `prettier --write` over the whole tree — it rewrites line endings; use `npm run lint` or eslint on specific files.

## Architecture

### Prisma client location
The Prisma client is generated to `generated/prisma/` at the repo root (not `node_modules/@prisma/client`). Import models, enums and `PrismaClient` from `'../../generated/prisma/client'` (relative path). `PrismaModule` is `@Global()`, so feature modules inject `PrismaService` without importing the module. Prisma CLI config (schema path, `DATABASE_URL`) lives in `prisma.config.ts`.

### Feature module conventions
Each feature in `src/<feature>/` has `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `dto/responses/` and optionally `types/`. Controllers are nested under parent resources (e.g. `projects/:projectId/tasks`), use `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()`, and get the user via `@GetCurrentUser() user: CurrentUser` (`{ id, email }`), passing `user.id` into the service.

The global `ValidationPipe` uses `whitelist`, `forbidNonWhitelisted` and `transform` — every accepted body field and query parameter must be declared on a DTO.

### Authorization model
There is no role guard. Membership checks go through `WorkspaceAccessService` (`src/workspace-access/`, import `WorkspaceAccessModule`): `getWorkspaceMembership`, `ensureWorkspaceMember`, `ensureProjectMember`, `isProjectMember`, `ensureTaskMember(taskId, userId, projectId?)`. Arguments are always `(resourceId, userId)`. Don't add new private `ensure…Member` helpers; resource-specific queries with `include` (e.g. `getTaskWithMembership`) stay in their service.

Non-members get `NotFoundException` (not 403) so resource existence isn't leaked. Workspace roles are `OWNER | ADMIN | MEMBER`; OWNER/ADMIN can manage any task, others only tasks they created (`canManageTask`).

### Activity log + transactions
Task mutations run inside `prisma.$transaction(async (tx) => ...)` and record a `TaskActivityLog` row via `TaskActivityService.create(input, tx)` — services accepting an optional `tx: PrismaTransactionClient` (`src/prisma/types/`) is the pattern for joining a transaction. Simple field toggles (archive/flag) go through `TasksService.updateWithActivity`. Adding a new kind of task change usually means: add a value to the `TaskActivityType` enum in `schema.prisma`, create a migration, and log it in the transaction. Who gets notified about task changes is decided in `TaskNotificationsService`.

### Background jobs (`src/queues/`)
Three queues, each a module with `*.constants.ts` (queue name + job-name map), a `*QueueService` that producers inject to enqueue, and a `*QueueProcessor` (`WorkerHost`, switches on `job.name`):
- `notifications` — in-app notifications and delayed task-reminder jobs
- `email` — password-reset emails via SendGrid
- `task_export` — CSV exports (progress, cooperative cancellation, retry; status in `task_exports` table)

Each queue module also registers with Bull Board. Shared retry/backoff settings are in `src/queues/config/default-job-options.ts`. Domain modules and their queue modules depend on each other (processor calls back into the domain service), resolved with `forwardRef` — e.g. `TaskExportsModule` ↔ `TaskExportQueueModule`, `TaskRemindersModule` ↔ `NotificationsQueueModule`. Producers never write notifications directly; they enqueue via `NotificationsQueueService`. When re-queueing work for an existing row, update the row before adding the job so a fast worker can't have its result overwritten (see `TaskExportsService.retry`).

### Security setup
`main.ts` applies Helmet (CSP without `upgrade-insecure-requests`) and CORS from `CORS_ORIGINS`. `ThrottlerGuard` is global (100 req/min); public auth routes override it with `@Throttle`. Bull Board is guarded by `createBullBoardAuthMiddleware`: Basic auth when `BULL_BOARD_USERNAME`/`PASSWORD` are set, 404 in production without them, open otherwise. Auth is Bearer-header only (no cookies), which is why there is no CSRF middleware.

### Files
Uploads use Multer `diskStorage` configs (`src/attachments/config/`, `src/users/config/`) writing to `uploads/` (gitignored) with UUID storage names; DB rows keep the storage name. CSV exports go to `uploads/exports/tasks`.

### Shared code (`src/common/`)
Pagination uses `PaginatedResponse<T>` + `createPaginationMeta(total, page, limit)` with `page`/`limit` query params (defaults 1/10) and `Promise.all([findMany, count])`. Mentions in comments use the `@[<uuid>]` format (`extractMentionUserIds`).

## Testing

Unit tests mock collaborators with `{ provide: X, useValue: {...} }`; scaffold specs use `.useMocker(() => ({}))` so DI resolves. Jest maps `.js` import suffixes (needed for the generated Prisma client). Specs that don't boot Nest but use class-transformer need `import 'reflect-metadata'`. Services with real coverage: `WorkspaceAccessService`, `TasksService`, `TaskNotificationsService`, `TaskExportsService`, `EmailService`, env validation, Bull Board auth.

`RecurringTasksModule` has an empty service/controller so far; the `RecurringTask` model already exists in the schema.
