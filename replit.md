# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Full-stack project and task management dashboard ("Dasbord").

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Routing**: wouter
- **Data fetching**: TanStack React Query (via Orval-generated hooks)

## Artifacts

- `artifacts/dashboard` — React + Vite frontend at `/`
- `artifacts/api-server` — Express 5 REST API at `/api`

## Features

- Dashboard home with summary stats, project status chart, and recent tasks
- Projects: list, create, edit, delete with color coding
- Tasks: list, filter by status/project, create, edit, delete
- Task statuses: todo / in_progress / done
- Task priorities: low / medium / high

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Database Schema

- `projects` — id, name, description, color, created_at, updated_at
- `tasks` — id, title, description, status, priority, project_id (FK), due_date, created_at, updated_at

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
