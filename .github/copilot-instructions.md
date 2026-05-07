# Agila Business Academy — Copilot Instructions

## Project Overview

**Agila Business Academy** is the internal employee learning platform for Agila. It is a **Learning Management System (LMS)** where all instructional and training videos are organized and delivered to employees. After every video, module, or series, employees must complete an exam or set of questions to assess comprehension and track progress.

> This is a standalone platform separate from the main ATMS internal ERP. It is exclusively for employee training, knowledge assessment, and learning progress tracking.

### Business Context

- Employees of Agila (and clients, when applicable) access training content assigned or available to their role
- Content is organized into **Series → Modules → Videos** (a series contains modules; a module contains videos)
- After each **video**, **module**, or **series**, an **exam** (set of questions) must be completed
- Exam results are scored, recorded, and used to track employee progress and issue completion certificates
- Admins (HR/Training officers) manage content, upload videos, create exams, assign training paths, and review results
- Operates within the Agila organizational context (Cebu City and surrounding areas)

### Platform Modules

| Module              | Route                          | Purpose                                                                 |
| ------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Dashboard           | `/dashboard`                   | Home overview, assigned courses, progress summary, recent activity      |
| Library             | `/library`                     | Browse all available series and modules                                 |
| Series Detail       | `/library/[seriesId]`          | View a series, its modules, and progress                                |
| Module Detail       | `/library/[seriesId]/[moduleId]` | View a module's videos and exam status                                |
| Video Player        | `/learn/[videoId]`             | Watch a training video; triggers post-video exam on completion          |
| Exam                | `/exam/[examId]`               | Take a post-video, post-module, or post-series exam                     |
| Exam Results        | `/exam/[examId]/results`       | View scored results, correct answers, and feedback after submission     |
| My Progress         | `/progress`                    | Personal dashboard: completed modules, scores, pending exams, streaks   |
| Certificates        | `/certificates`                | Download or view earned completion certificates                         |
| Admin — Content     | `/admin/content`               | Manage series, modules, and videos (CRUD)                               |
| Admin — Exams       | `/admin/exams`                 | Create and manage exam questions per video/module/series                |
| Admin — Employees   | `/admin/employees`             | Manage which employees are enrolled in which series                     |
| Admin — Results     | `/admin/results`               | View all employee exam submissions and scores                           |
| Profile             | `/profile`                     | Employee account settings, avatar, notification preferences             |

---

## Agent Workflow

> **Mandatory for every task involving code changes.**

1. **Plan first** — Before writing or modifying any code, present a clear summary of:
   - The problem or feature being addressed
   - Which files will be created, edited, or deleted
   - The implementation approach and any trade-offs
2. **Wait for approval** — Do **not** proceed with code changes until the user explicitly confirms the plan.
3. **Iterate** — If the user requests adjustments to the plan, revise and re-present before implementing.
4. **Execute** — Only after approval, carry out the changes and report what was done.

This applies to all feature work, refactors, bug fixes, and schema changes. Trivial questions, file reads, or research tasks do not require a plan.

---

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Framework    | Next.js 15 (App Router)                          |
| Language     | TypeScript 5                                     |
| UI           | React 19                                         |
| Styling      | Tailwind CSS v4 + custom theme (see below)       |
| Database     | PostgreSQL (via `@prisma/adapter-pg`)             |
| ORM          | Prisma 6 (multi-file schema in `prisma/models/`) |
| Auth         | BetterAuth (email + password, session cookies)   |
| Validation   | Zod                                              |
| Video        | Custom HTML5 player or embedded (e.g., Bunny.net / Cloudflare Stream) |
| Charts       | Recharts                                         |
| Icons        | `lucide-react`                                   |
| Fonts        | Geist Sans + Geist Mono (Google Fonts)           |
| Container    | Docker (Dockerfile + compose.yaml)               |

---

## Project Structure

```
prisma/
  schema.prisma             # Prisma config (generator + datasource only)
  models/
    users.prisma            # User, Session, Account, Verification + Role enum
    content.prisma          # Series, Module, Video
    exam.prisma             # Exam, Question, Choice, ExamAttempt, ExamAnswer
    enrollment.prisma       # Enrollment, VideoProgress, ModuleCompletion, SeriesCompletion
    certificate.prisma      # Certificate
    activity-logs.prisma    # ActivityLog
  migrations/
src/
  app/
    layout.tsx              # Root layout (ThemeProvider wraps all pages)
    globals.css             # Tailwind + custom CSS variables (light/dark)
    page.tsx                # Landing / login redirect
    (auth)/                 # Auth route group (sign-in, register, forgot-password)
    (learner)/              # Learner route group (dashboard, library, learn, exam, progress, certificates)
    (admin)/                # Admin route group (content, exams, employees, results)
    api/
      auth/                 # BetterAuth handler
      series/               # CRUD for series
      modules/              # CRUD for modules
      videos/               # CRUD for videos + progress tracking
      exams/                # CRUD for exams + question management
      attempts/             # Exam attempt submission and scoring
      enrollment/           # Enrollment management
      certificates/         # Certificate generation and retrieval
      progress/             # Employee progress aggregation
  components/
    UI/                     # Shared reusable components (Modal, Card, Badge, Button, Input, VideoPlayer)
    content/                # Series, module, video card and list components
    exam/                   # Exam question renderer, timer, results breakdown
    progress/               # Progress bars, completion rings, streak indicators
    admin/                  # Admin table, form, and filter components
    dashboard/              # Learner dashboard widgets
    notifications/          # Notification components
  context/
    AuthContext.tsx          # Auth state (current user + role)
    ThemeContext.tsx         # Light/dark theme toggle (localStorage persistence)
  lib/
    db.ts                   # Prisma singleton (PrismaPg adapter)
    auth.ts                 # BetterAuth server instance
    auth-client.ts          # BetterAuth client instance
    types.ts                # Shared TypeScript interfaces
    constants.ts            # Role permissions, route constants, passing score thresholds
    scoring.ts              # Exam scoring utilities
    certificate.ts          # Certificate generation helper
    activity-log.ts         # Fire-and-forget activity logger
    notification.ts         # Fire-and-forget notification helper
    schemas/                # Shared Zod schemas
    mock-*.ts               # Mock data files (reference only — replace with real API calls)
```

---

## Domain Model Overview

### Content Hierarchy

```
Series
  └── Module (ordered, belongs to one Series)
        └── Video (ordered, belongs to one Module)
              └── Exam (optional, linked to Video | Module | Series)
```

- A **Series** is a complete training course (e.g., "New Employee Onboarding")
- A **Module** is a chapter or topic within a series (e.g., "Company Policies")
- A **Video** is a single instructional clip within a module
- An **Exam** is a set of questions attached to a `Video`, `Module`, or `Series`
  - `Video`-level exam: shown immediately after the employee finishes watching the video
  - `Module`-level exam: shown after all videos in the module are completed
  - `Series`-level exam: shown after all modules in the series are completed

### Exam and Scoring

- Each `Question` belongs to one `Exam` and has a type: `MULTIPLE_CHOICE`, `TRUE_FALSE`, or `SHORT_ANSWER`
- Each `Choice` belongs to a `Question`; one or more choices may be marked `isCorrect`
- An `ExamAttempt` records a single employee submission (timestamp, score, pass/fail)
- An `ExamAnswer` records the employee's selected choice(s) per question in an attempt
- **Passing score** is configurable per exam (default: 75%)
- Employees may retake failed exams up to the `maxAttempts` limit set on the exam
- A `Certificate` is issued when a `SeriesCompletion` is recorded and the series requires one

### Progress Tracking

- `VideoProgress` — tracks watch percentage and `completedAt` per employee per video
- `ModuleCompletion` — recorded when all videos in a module are watched and the module exam (if any) is passed
- `SeriesCompletion` — recorded when all modules in a series are completed and the series exam (if any) is passed

---

## Coding Rules

### Linting (ESLint)

- Config: `eslint.config.mjs` — flat config with `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Run: `npm run lint` — must pass with **zero errors** before committing
- Generated files (`src/generated/**`) are excluded from linting

#### Key rules and conventions

| Rule | Level | Convention |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | warn | Prefix intentionally unused variables with `_` (e.g., `_request`, `_error`) |
| `@typescript-eslint/no-explicit-any` | warn | Avoid `any` — use specific types, `unknown`, `Record<string, unknown>`, or union types |
| `@typescript-eslint/no-empty-object-type` | warn | Use `type Alias = ParentType` instead of `interface Alias extends ParentType {}` |
| `react-hooks/set-state-in-effect` | error | **Never** call `setState` synchronously in `useEffect` — use the "adjust state during render" pattern or lazy initializers |
| `react-hooks/purity` | error | **Never** call impure functions (`Date.now()`, `Math.random()`) during render — use `crypto.randomUUID()` or move to event handlers |
| `react-hooks/exhaustive-deps` | warn | Include all dependencies; wrap expensive object creation in `useMemo` to stabilize references |
| `prefer-const` | warn | Use `const` when a variable is never reassigned |

#### Unused variables pattern

```typescript
// Prefix with _ to signal intentional non-use
export async function GET(_request: NextRequest) { ... }
const [_error] = useState<string | null>(null);
```

#### Resetting state when props change (no useEffect)

Use the React-approved "adjust state during render" pattern instead of `useEffect` + `setState`:

```typescript
// ✅ Correct — adjust state during render
const [prevIsOpen, setPrevIsOpen] = useState(false);
if (isOpen !== prevIsOpen) {
  setPrevIsOpen(isOpen);
  if (isOpen) {
    setStep('initial');
    setFormData({});
  }
}

// ❌ Wrong — triggers cascading renders
useEffect(() => {
  if (isOpen) {
    setStep('initial');
    setFormData({});
  }
}, [isOpen]);
```

#### Resetting pagination on filter change

```typescript
// ✅ Correct — derived reset during render
const [prevFilters, setPrevFilters] = useState({ searchTerm, filterSeries });
if (prevFilters.searchTerm !== searchTerm || prevFilters.filterSeries !== filterSeries) {
  setPrevFilters({ searchTerm, filterSeries });
  setCurrentPage(1);
}

// ❌ Wrong — setState in useEffect
useEffect(() => { setCurrentPage(1); }, [searchTerm, filterSeries]);
```

#### Exception: localStorage / browser API sync

Suppress the lint rule when reading browser-only APIs on mount (hydration-safe pattern):

```typescript
/* eslint-disable react-hooks/set-state-in-effect -- Hydration-safe: must read localStorage after mount */
useEffect(() => {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') setTheme('dark');
  setMounted(true);
}, []);
/* eslint-enable react-hooks/set-state-in-effect */
```

### TypeScript

- Never use `any` or implicit `any`
- Prefer explicit, strongly typed interfaces and types
- Always include the file path as the first comment in every code block
- Define shared types in `src/lib/types.ts`
- Use Zod schemas for all form and API input validation

### React Components

- **DO NOT** use `React.FC` or `React.FunctionComponent`
- Use explicit return types:
  - `React.ReactNode` — default for most components
  - `JSX.Element` — when returning a single element
  - `React.ReactElement` — when cloning or inspecting elements
- Always explicitly define `children` prop when needed (do not rely on implicit children)
- Use `next/image` `<Image />` — **never** `<img>`
- Use `lucide-react` — **not** Heroicons

### State Management

- **DO NOT** call `setState` synchronously within `useEffect`
- Prefer deriving state from props over `useState`
- Only use mounting state pattern for browser-only APIs or hydration mismatch prevention
- Use `useEffect` only for:
  - Syncing with external systems (e.g., reporting video watch progress)
  - Subscribing to external data
  - Timers / intervals (e.g., exam countdown)

### Styling

- **Tailwind CSS v4** with custom theme variables defined in `src/app/globals.css`
- Custom CSS variables for light/dark mode: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--sidebar`, `--header`, etc.
- Mapped to Tailwind via `@theme inline` block (e.g., `bg-background`, `text-foreground`, `bg-card`)
- Dark mode: uses `.dark` class on `<html>` element, toggled via ThemeContext
- Font: `font-sans` maps to Geist Sans, `font-mono` maps to Geist Mono

### Toast Notifications

- Use the `useToast()` hook from `@/context/ToastContext` for **all** user-facing feedback
- **Every successful operation** (enroll, submit exam, complete video, generate certificate) must show a `success()` toast
- **Every failed operation** (API error, validation failure, exam submission error) must show an `error()` toast
- Apply to modals, forms, inline actions, and any workflow that produces a result
- Toast messages should be concise and user-friendly — never expose raw error objects or stack traces
- Usage:
  ```typescript
  // src/components/exam/ExamForm.tsx
  import { useToast } from '@/context/ToastContext';

  const { success, error } = useToast();

  // After a successful exam submission
  success('Exam submitted', 'Your answers have been recorded. View your results below.');

  // After a failed submission
  error('Submission failed', 'Please check your answers and try again.');
  ```

### Error Response Convention

- Use `{ error: "..." }` key for error responses (not `{ message: "..." }`)
- Never expose `error.message` in 500 responses to clients
- Always add toast on modals for successful and failed operations

### Layouts — Do Not Modify

- Do not change any layout unless explicitly asked
- If recommending layout changes, explain the UX advantage first

---

## Authentication (BetterAuth)

This platform runs its own BetterAuth server for employee authentication.

### Session Cookies

| Cookie | Contents | Set by |
|--------|----------|--------|
| `better-auth.session_token` | Session token | BetterAuth sign-in handler |

All session cookies are `HttpOnly`, `SameSite: lax`.

### Auth Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/[...all]` | ALL | BetterAuth catch-all handler |
| `/sign-in` | GET | Employee sign-in page |
| `/sign-out` | POST | Clears session and redirects to `/sign-in` |

### Page Protection (Middleware)

`src/middleware.ts` — checks for `better-auth.session_token` cookie. Redirects unauthenticated users to `/sign-in`. Covers `/dashboard/**`, `/library/**`, `/learn/**`, `/exam/**`, `/progress/**`, `/certificates/**`, and `/admin/**`.

Admin routes (`/admin/**`) additionally check that the user has the `ADMIN` or `SUPER_ADMIN` role. Non-admin users are redirected to `/dashboard`.

### Server-Side Session Helper

All API routes and server components must use BetterAuth's server-side session helper:

```typescript
// src/app/api/some-route/route.ts
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { user } = session;
  // user.id, user.role, user.email available here
}
```

---

## Database (Prisma)

- Config: `prisma.config.ts` (uses `dotenv/config` for env loading)
- Schema: Multi-file schema — `prisma/schema.prisma` for generator/datasource, models in `prisma/models/*.prisma`
- Client: Singleton in `src/lib/db.ts` using `PrismaPg` adapter with connection string from `DATABASE_URL`
- Generated client output: `src/generated/prisma/` — **never edit generated files**
- Always use `prisma` (the default export from `src/lib/db.ts`) for database operations

### Prisma Conventions

- Run `npx prisma migrate dev` after schema changes
- Run `npx prisma generate` to regenerate the client after schema or config changes
- Use `@@map()` for custom table names where needed
- Use `@default(cuid())` for string IDs, `@default(autoincrement())` for integer IDs
- Use `Decimal` with `@db.Decimal(precision, scale)` for monetary values
- Always include `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on models

### Key Exam-Related Schema Conventions

- `Exam.passingScore` — stored as an integer percentage (e.g., `75` = 75%)
- `Exam.maxAttempts` — `0` means unlimited retakes; any positive integer caps retakes
- `Exam.scope` — enum: `VIDEO | MODULE | SERIES`
- `ExamAttempt.score` — integer percentage of correct answers (calculated server-side on submission)
- `ExamAttempt.passed` — boolean, derived from `score >= exam.passingScore`
- Never trust client-submitted scores — always recalculate server-side on submission

---

## Form Validation (Zod)

- Use Zod schemas for all form inputs and API request bodies
- Co-locate schemas with the component or API route that uses them, or in `src/lib/schemas/` for shared schemas
- Infer TypeScript types from Zod schemas with `z.infer<typeof schema>`
- Example:
  ```typescript
  // src/lib/schemas/exam.ts
  import { z } from "zod";

  export const submitExamSchema = z.object({
    attemptId: z.string().cuid(),
    answers: z.array(
      z.object({
        questionId: z.string().cuid(),
        selectedChoiceIds: z.array(z.string().cuid()).min(1),
      })
    ).min(1),
  });

  export type SubmitExamInput = z.infer<typeof submitExamSchema>;
  ```

---

## API Routes

- Place API routes under `src/app/api/` following Next.js App Router conventions
- Use Route Handlers (`route.ts`) with named exports: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Always validate request body with Zod before processing
- Always authenticate via BetterAuth session helper — return 401 if no session
- Return consistent JSON responses:
  - Success: `NextResponse.json({ data: ... })`
  - Error: `NextResponse.json({ error: "..." }, { status: 4xx/5xx })`
- **Exam scoring must always be computed server-side** — never accept a score value from the client

### Exam Submission Flow

1. Employee POSTs answers to `/api/attempts/[attemptId]/submit`
2. Server loads exam questions and correct choices from the database
3. Server computes score by comparing submitted `selectedChoiceIds` against `isCorrect` choices
4. Server saves `ExamAttempt` with computed `score` and `passed`
5. If passed and all prerequisites met, server creates `ModuleCompletion` or `SeriesCompletion`
6. If `SeriesCompletion` created and series `requiresCertificate = true`, server issues a `Certificate`
7. Server returns `{ data: { score, passed, attemptId } }`

---

## Activity Logging

- Utility: `src/lib/activity-log.ts` — fire-and-forget logger using `logActivity()`
- Model: `ActivityLog` in `prisma/models/activity-logs.prisma`
- **Every mutating API route** (enroll, submit exam, create content, delete video, etc.) must log the action
- Call with `void` so it never blocks the response:
  ```typescript
  import { logActivity, getRequestMeta } from '@/lib/activity-log';

  void logActivity({
    userId: session.user.id,
    action: "SUBMITTED",
    entity: "ExamAttempt",
    entityId: attempt.id,
    description: `Submitted exam for module "${module.title}" — score: ${score}%`,
    ...getRequestMeta(request),
  });
  ```
- Available `LogAction` values: `CREATED`, `UPDATED`, `DELETED`, `VIEWED`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CANCELLED`, `ARCHIVED`, `RESTORED`, `LOGIN`, `LOGOUT`, `ASSIGNED`, `UNASSIGNED`, `STATUS_CHANGE`
- `description` should be human-readable
- Use `metadata` (JSON) for structured before/after values when logging updates

---

## Internal Notifications

- Utility: `src/lib/notification.ts` — fire-and-forget notification creator
- Model: `InternalNotification` in `prisma/models/internal-notif.prisma`
- Use `notify()` for single-recipient and `notifyMany()` for multi-recipient notifications
- Call with `void` so it never blocks the response:
  ```typescript
  import { notify } from '@/lib/notification';

  // Notify employee they passed an exam
  void notify({
    recipientId: session.user.id,
    type: "SUCCESS",
    title: "Exam passed!",
    message: `You passed the "${exam.title}" exam with a score of ${score}%.`,
    entity: "ExamAttempt",
    entityId: attempt.id,
    actionUrl: `/exam/${exam.id}/results/${attempt.id}`,
  });

  // Notify admin a new exam was failed after max attempts
  void notify({
    recipientId: adminId,
    type: "WARNING",
    title: "Employee failed exam",
    message: `${session.user.name} has exhausted all attempts for "${exam.title}".`,
    entity: "ExamAttempt",
    entityId: attempt.id,
    actionUrl: `/admin/results?employeeId=${session.user.id}`,
  });
  ```
- Available `NotificationType` values: `INFO`, `SUCCESS`, `WARNING`, `ERROR`, `ACTION_REQUIRED`
- Available `NotificationPriority` values: `LOW`, `NORMAL`, `HIGH`, `URGENT`
- Always set `entity` and `entityId` when the notification relates to a specific record
- Always set `actionUrl` when the user should be able to click through to a relevant page

---

## Role-Based Access Control

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Full access to all admin routes and all learner routes |
| `ADMIN` | Full access to admin content/exam/employee/results management |
| `EMPLOYEE` | Access to learner routes only (library, learn, exam, progress, certificates) |

- Enforce role checks both client-side (conditional rendering) and server-side (API route guards)
- Employees can only access series they are enrolled in (or series marked as `isPublic = true`)
- Employees can only see their own exam attempts and progress — never expose other employees' results
- Admins can view all employees' results and progress

---

## Shared UI Components

Reusable components live in `src/components/UI/`:

- `Modal.tsx` — Generic modal with `isOpen`, `onClose`, `title`, `size` props
- `Card.tsx` — Card wrapper with consistent styling
- `Badge.tsx` — Status badges with variant support (`neutral`, `danger`, `success`, `warning`, etc.)
- `Button.tsx` — Reusable button
- `Input.tsx` — Form input
- `VideoPlayer.tsx` — HTML5 / embedded video player with progress reporting
- `ProgressBar.tsx` — Completion percentage bar for modules and series
- `ExamTimer.tsx` — Countdown timer for timed exams

Always check `src/components/UI/` before creating new generic components — extend existing ones when possible.

---

## Component Structure Convention

### Page-Specific vs Global Components

Components that are **only used by a single page** must live in a `components/` folder co-located with that page.

```
src/app/(learner)/exam/[examId]/
  page.tsx                     # Thin page wrapper — imports from ./components/
  components/
    ExamShell.tsx               # Main exam layout (question nav, timer, submit)
    QuestionCard.tsx            # Renders a single question + choices
    ExamSubmitModal.tsx         # Confirm before final submission
```

**Rules:**
- Page-specific components go in `<page-folder>/components/`
- Global/shared components stay in `src/components/UI/` or `src/components/<module>/`
- When a component is used by 2+ unrelated pages, promote it to `src/components/UI/` or the appropriate module folder
- The `page.tsx` file itself should be a thin wrapper that imports and renders the main component

### Data Fetching — API-First

- **Every page and component must use real API routes** for data (GET, POST, PUT, DELETE)
- **Do NOT use mock data** in components — mock files (`src/lib/mock-*.ts`) are reference-only during transition
- Before building a new page, check if API routes already exist under `src/app/api/` — if they do, use them
- If a page currently uses mock data, refactor it to call the real API as part of the work

---

## Key Patterns

### Video Progress Reporting

- As the employee watches a video, the client periodically POSTs watch progress to `/api/videos/[videoId]/progress` (every 10–15 seconds and on pause/close)
- Progress is stored as `watchedSeconds` and `durationSeconds` in `VideoProgress`
- When `watchedSeconds / durationSeconds >= 0.9` (90% watched), the server marks `VideoProgress.completedAt`
- After completion, the client is redirected to the post-video exam (if one exists) or back to the module page
- Never allow an employee to access a post-video exam without a completed `VideoProgress` record for that video

### Exam Lock Pattern

- Employees cannot start a module or series exam until all prerequisite videos/modules are completed
- Employees cannot retake an exam if `attempt count >= exam.maxAttempts` (and `maxAttempts > 0`)
- These locks must be enforced **server-side** on the exam start and submission endpoints — never rely solely on client-side UI

### Module Sidebar Pattern

All module sidebars follow the same structure:
- Fixed overlay on mobile, static column on `lg:` breakpoint
- Slide-in/out animation
- Logo header → navigation groups → footer with user info
- Badge indicators for pending exams and completion counts

### Mock Data (Transitional)

- Mock data files in `src/lib/mock-*.ts` exist as reference for data shapes only
- **All new features must use real API routes** — never introduce new mock data
- When touching a page that still uses mock data, refactor it to call the real API
- Keep mock files around until all pages have been migrated
