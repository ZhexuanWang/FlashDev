# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlashDev is a full-stack CMS website with an inline editing overlay. The site showcases projects, team members, and services. COMPANY/ADMIN roles can edit content directly through a floating toolbar without leaving the page.

## Stack

- **Frontend**: React 19 + TypeScript, Vite, TailwindCSS v4, Zustand, React Router v7, i18next, Framer Motion, Three.js / React Three Fiber
- **Backend**: NestJS, Prisma ORM, PostgreSQL, JWT auth (Passport), Nodemailer, Swagger
- **Dev**: Docker (compose + nginx — currently stubs)

## Commands

### Frontend
```bash
cd frontend
npm run dev        # dev server on :5173
npm run build      # production build
npm run lint       # ESLint
npm run preview    # preview production build
```

### Backend
```bash
cd backend
npm run start:dev   # dev server with watch on :3000
npm run build       # compile to dist/
npm run start:prod  # run compiled dist/
npm run seed        # seed database
npx prisma studio   # open Prisma DB browser
```

## Architecture

### Database Models (PostgreSQL via Prisma)
- **User** — email, password, role (COMPANY/ADMIN/USER), permissions JSON, isActive
- **SiteConfig** — key/value CMS settings (theme colors, intro video URL, contact email, rtl_enabled, etc.)
- **Project** — title/description as JSON (i18n), type (SHOWCASE/FOR_SALE/CUSTOM), category FK, media array, price
- **ProjectCategory** — name JSON (i18n), icon, order
- **TeamMember** — name/role/bio as JSON (i18n), avatar URL, github, order
- **Translation** — raw i18n key-value overrides keyed by (lang, key)

### Multi-language Strategy
Translatable content is stored as JSON objects `{zh: "...", en: "..."}` throughout the database and frontend locale files (`src/i18n/locales/zh.ts`, `src/i18n/locales/en.ts`). The UI reads `lang` from site config and switches at render time. Some DB fields (title, description, name, bio, role) are thus JSON columns, not plain strings.

### Backend Module Structure
Each feature is a NestJS module. Core modules:
- **AuthModule** — JWT login/register, JwtStrategy, RolesGuard
- **UsersModule** — user management, permission updates
- **SiteConfigModule** — CRUD for key/value site settings
- **ProjectsModule** / **ProjectCategoriesModule** — project and category management
- **TeamModule** — team member management
- **MailModule** / **ContactModule** — contact form email sending

### Frontend State (Zustand)
- `authStore` — token, role, userId, permissions, login/logout helpers
- `editorStore` — isEditing flag, token/role for edit mode (entered on COMPANY/ADMIN login)
- `siteStore` — site config values (theme, lang, etc.)
- `powerStore`, `themeStore`, `editorStore` — UI/feature-specific state

### Inline Editing Flow
1. COMPANY/ADMIN login → `authStore.login()` sets token/role
2. `login()` calls `editorStore.enterEditMode()` → `EditorToolbar` becomes visible
3. Editable fields (via `EditableText`, `EditableTextarea` components) show edit controls
4. Changes are saved via API calls using the stored token

### API Conventions
- Backend serves static uploads at `/uploads/*` (pointing to `../uploads` on disk)
- CORS allows `http://localhost:5173` in dev
- All mutation DTOs use `class-validator` + `ValidationPipe` (whitelist + transform)
- Swagger docs at backend root when running

### Environment Files
- `backend/.env` — DATABASE_URL, JWT_SECRET, mail credentials (not committed)
- Frontend uses Vite's default `.env` (VITE_API_URL if needed)
