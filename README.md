# Digital Asset Management

A production-ready Digital Asset Management (DAM) system built with React, TypeScript, and Vite. Upload, organize, and manage images and videos with real-time progress tracking, infinite scroll, and role-based views.

## Features

- **File Upload** — Drag-and-drop uploader supporting PNG, JPG, WebP, SVG, MP4, and MPEG via presigned S3 URLs
- **Upload Progress** — Real-time per-file progress tracking (0–100%) with status states: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`
- **Virtualized File Table** — Infinite-scrolling file list with cursor-based pagination for large collections
- **Search** — File search by name with instant cache invalidation and refetch
- **Media Preview** — Inline image and video previews on row click
- **Role-based Views** — User view for personal files; Admin view for all users' files
- **Session Auth** — Cookie-based authentication with auto-redirect for unauthenticated users
- **Dark Mode** — Full dark mode support via Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 with HTTPS (mkcert) |
| State | Redux Toolkit |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 |
| Virtualization | react-window + react-window-infinite-loader |
| File Upload | react-dropzone |
| Testing | Jest + React Testing Library |
| Containerization | Docker (Node 18 → Nginx Alpine) |

## Project Structure

```
src/
├── components/
│   ├── auth/           # Sign-in form
│   ├── form/           # Form inputs, dropzone
│   ├── tables/         # Virtualized file table
│   └── ui/             # Reusable primitives (button, modal, badge, etc.)
├── pages/
│   ├── Files.tsx       # User upload & file management
│   ├── AdminDashboard.tsx
│   └── AuthPages/
├── layout/             # AppLayout, AppHeader, AppSidebar, ProtectedLayout
├── routes/             # Router config with lazy-loaded pages
├── store/              # Redux store
├── reducers/           # Auth, file, and error slices
├── services/           # API clients (auth, file, error logger)
├── hooks/              # useAuth, useFiles, useSidebar
├── contexts/           # Error and sidebar contexts
└── entities/           # TypeScript types (User, File, Error)
```

## Getting Started

### Prerequisites

- Node.js 18+
- The backend API running at `https://www.cpfsystem.local:4000`
- Local SSL certificate for `www.cpfsystem.local` (handled by `vite-plugin-mkcert`)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app starts at `https://www.cpfsystem.local:5173`.

### Production Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

| Variable | Description | Default (dev) |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `https://www.cpfsystem.local:4000` |
| `VITE_API_ENABLED` | Enable/disable API calls | `true` |

Create `.env.development` for local overrides (see `.env.docker` for Docker values).

## Docker

Build and run the full app with Nginx as a reverse proxy:

```bash
docker build -t dam-frontend .
docker run -p 80:80 -p 443:443 dam-frontend
```

The Nginx configuration:
- Redirects HTTP → HTTPS
- Serves the Vite build as static files
- Proxies `/api/*` → `http://node:4000`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HTTPS |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Format with Prettier |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Jest in watch mode |

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/users/login` | Email + password login |
| `POST` | `/users/logout` | Clear session |
| `POST` | `/users/checkAuth` | Verify session, get user info |
| `GET` | `/files` | Paginated file list (cursor-based) |
| `POST` | `/upload` | Initialize upload, get presigned S3 URL |
| `PATCH` | `/files/:id` | Update file status |
| `GET` | `/files/:id` | Get single file details |

## File Upload Flow

1. User drops files onto the dropzone
2. `POST /upload` returns file metadata and a presigned S3 URL
3. File is added to Redux store with `PENDING` status
4. `XMLHttpRequest` PUTs the binary to the presigned URL with progress tracking
5. On completion, `PATCH /files/:id` updates status to `COMPLETED` or `FAILED`

## Testing

Tests live in the `tests/` directory and cover reducers and key components:

```bash
npm test
```

- **login.test.tsx** — Auth reducer, `SignInForm` component, login/logout thunks
- **files.test.tsx** — File reducer, `FilesTable` component, pagination and filter logic

## CI/CD

GitHub Actions runs on every push and PR to `main`:

1. Install dependencies (`npm ci`)
2. Build (`npm run build`)
3. Test (`npm test`)

A Husky pre-commit hook runs ESLint and Prettier on staged files before each commit.

## License

MIT
