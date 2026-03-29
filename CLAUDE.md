# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Only add comments for genuinely complex logic. Skip obvious or self-explanatory comments.

## Commands

```bash
# First-time setup (install deps + Prisma generate + migrate)
npm run setup

# Development server (Turbopack)
npm run dev

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Production build
npm run build

# Reset database
npm run db:reset
```

The dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` — this is already included in all npm scripts. Don't invoke `next dev` directly.

The app runs without an `ANTHROPIC_API_KEY`; it falls back to a `MockLanguageModel` that streams static component code.


## Architecture

UIGen is an AI-powered React component generator. Users chat with Claude, which generates React components into a **virtual in-memory file system**. The right panel shows either a live preview (iframe) or a code editor.

### Key Data Flow

1. User sends a message via `ChatInterface` → `ChatProvider` (uses Vercel AI SDK `useChat`) → `POST /api/chat`
2. The API route reconstructs a `VirtualFileSystem` from the serialized `files` payload, then calls `streamText` with two tools: `str_replace_editor` and `file_manager`
3. Claude calls those tools to create/edit files in the VFS
4. The client receives tool call events; `FileSystemContext.handleToolCall` applies them to the client-side VFS
5. `PreviewFrame` watches `refreshTrigger` on `FileSystemContext`, transforms all files via Babel + Blob URLs + import maps, and injects the resulting HTML into an `<iframe srcdoc>`
6. On finish, if the user is authenticated and a `projectId` exists, the API saves both serialized messages and VFS state to the `Project` row in SQLite

### Core Modules

| Path | Purpose |
|---|---|
| `src/app/api/chat/route.ts` | Streaming AI endpoint; reconstructs VFS, runs `streamText`, persists to DB |
| `src/lib/file-system.ts` | `VirtualFileSystem` class — in-memory tree, serialize/deserialize |
| `src/lib/transform/jsx-transformer.ts` | Babel-transforms JSX/TSX, builds ES module import maps, generates preview HTML |
| `src/lib/contexts/file-system-context.tsx` | Client-side VFS state; `handleToolCall` bridges AI tool events to the VFS |
| `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat`, passes `files` in the request body |
| `src/lib/provider.ts` | `getLanguageModel()` — returns real `anthropic(MODEL)` or `MockLanguageModel` |
| `src/lib/auth.ts` | JWT sessions via `jose`, stored in `httpOnly` cookies (server-only) |
| `src/lib/tools/str-replace.ts` | Builds the `str_replace_editor` tool (create / str_replace / insert / view) |
| `src/lib/tools/file-manager.ts` | Builds the `file_manager` tool (rename / delete) |
| `src/lib/prompts/generation.tsx` | System prompt for component generation |
| `src/components/preview/PreviewFrame.tsx` | Renders the iframe; entry-point detection logic (prefers `/App.jsx`) |
| `src/components/editor/` | `FileTree` and `CodeEditor` (Monaco) for the Code tab |
| `src/app/main-content.tsx` | Root layout with resizable panels: Chat | Preview/Code |

### State Management

- `FileSystemProvider` wraps the entire app and owns the `VirtualFileSystem` instance
- `ChatProvider` wraps the chat and passes serialized VFS files (`fileSystem.serialize()`) with every message to `/api/chat`
- Anonymous users' work is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts`; upon sign-in, it can be migrated to a new project

### Preview Rendering

`createImportMap` in `jsx-transformer.ts` does client-side bundling:
- Transforms each `.js/.jsx/.ts/.tsx` file with Babel standalone
- Creates `Blob` URLs for each transformed file
- Builds an ES module import map (maps paths and `@/` aliases to blob URLs)
- Third-party imports are resolved via `esm.sh`
- Missing local imports get auto-generated placeholder stub modules
- The resulting HTML is injected via `iframe.srcdoc`

### Auth & Persistence

- Auth is JWT-based (no NextAuth). `src/lib/auth.ts` is `server-only`.
- `verifySession` is called in `src/middleware.ts` to protect `/api/projects` and `/api/filesystem` routes
- `/api/chat` does its own session check inside `onFinish` before saving
- Prisma client is generated to `src/generated/prisma` (see `prisma/schema.prisma`)
- `Project.messages` and `Project.data` are JSON strings stored in SQLite TEXT columns

### Database Schema

The schema is defined in `prisma/schema.prisma` — refer to it whenever you need to understand the structure of data stored in the database.
