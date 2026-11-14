# Habitual

A habit and task tracker built with React and Vite for our Internet Programming capstone.

## Getting started

Use Docker Desktop with its Linux engine running. Copy `.env.example` to `.env`, fill in the PostgreSQL credentials, and set `SESSION_SECRET` to a private random value of at least 32 characters. Keep `.env` out of Git.

```sh
git clone https://github.com/haquemm583/Habitual.git
cd Habitual
docker compose up --build -d
```

Open http://localhost:9000. Source changes appear automatically. The backend health check is http://localhost:3000/api/health. See [using_docker.md](using_docker.md) for container commands.

For frontend development outside Docker, run `npm install` and `npm run dev` from `frontend/` with Node.js 22.12 or newer. Keep the backend and database running. Vite proxies `/api` to `http://localhost:3000` locally and `http://backend:3000` inside Docker. The production host must also route `/api` to the backend; Vite's development proxy is not part of the production build.

## Frontend commands

Run these from `frontend/`:

- `npm run dev`: start the development server.
- `npm run build`: build the app into `dist/`.
- `npm run preview`: preview the production build locally after building.
- `npm run lint`: check source code with Oxlint.

## Project structure

```text
backend/src/      Express routes, database pool, and session configuration
db/init/          PostgreSQL initialization scripts
frontend/
  public/         Static files, including mock/tasks.json
  src/
    auth/         Shared auth context and API requests
    components/   Reusable components, including auth provider and route guard
    pages/        Routed pages, such as Home, Dashboard, and Login
    App.jsx       App routes and layout
    index.css     Tailwind CSS entry point
    main.jsx      React root
```

Styling uses Tailwind CSS through its Vite plugin. Add utility classes directly to JSX `className` attributes; `src/index.css` defines the shared palette, theme colors, and motion tokens. No separate Tailwind or PostCSS configuration is needed.

App pages use a compact left sidebar on desktop. Hovering over it or moving keyboard focus inside expands it over the content without shifting the page and reveals text beside the icons. It collapses when the pointer and keyboard focus leave. Pin sidebar open keeps it expanded and reserves space beside the page; Unpin sidebar restores automatic expansion. The pin choice lasts while navigating app pages and resets on reload. Navigation and sidebar controls retain screen-reader names and high-contrast tooltips. Tooltips can be hovered and dismissed with Escape. The current page has a highlighted icon and `aria-current="page"`. Below 768px, Menu opens a navigation drawer with icons and text; selecting a link, pressing Escape, or choosing Close menu dismisses it. Login and registration use a separate layout without the sidebar. Expansion animation respects reduced-motion preferences.

Motion stays brief: pages enter with a subtle fade and 6px movement, the sidebar resizes and crossfades its branding, and the mobile drawer animates on opening. Sidebar hover has a 150ms closing grace period. Form controls and task rows ease their color changes. Route entry effects run when the pathname changes, so ordinary task and form updates do not restart them. Motion effects are disabled when the browser requests reduced motion.

Dark mode is available at the bottom of the sidebar, in the mobile navigation drawer, and above the sign-in and registration forms. The toggle exposes its state to assistive technology and supports keyboard activation. On the first visit, the theme uses the device preference. Choosing a theme saves `habitual-theme` in local storage and applies it before React loads on later visits. The toggle still works for the current visit if browser storage is unavailable.

## Authentication

The backend provides `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`. Open `/register` or follow the Create account link on Login to register with a name, email, and password of 8 to 128 characters. Passwords are hashed with Argon2id. Registration returns to Login with a success message and the account email filled in. Sign in to start a session. Invalid fields and duplicate email addresses display errors; authenticated visitors to `/register` return to Dashboard.

Sessions are stored in PostgreSQL; the session table is created automatically. The browser receives an HTTP-only cookie that expires after 24 hours. `NODE_ENV=production` requires HTTPS for this cookie. `FRONTEND_ORIGIN` defaults to `http://localhost:9000` and controls which frontend origin may submit authentication requests.

React checks the current session when the app starts. Logged-out Dashboard visits redirect to Login, and successful login returns to Dashboard. Logout removes the server session and updates navigation. Session-check failures display an error and retry control instead of rendering Dashboard. The public landing page includes a headline, account links, an introductory checklist, and team credit in the footer. Signed-in visitors to Home go directly to Dashboard. Dashboard still displays shared mock tasks; per-user task storage is not implemented.

Dashboard shows active tasks first and keeps completed tasks in a collapsed section with a count. Expand it to review tasks or uncheck an item to make it active again. Completion changes reset when Dashboard unmounts or the page reloads. Technical task-loading error details expand on demand. Required registration fields and password guidance remain visible.

### Manual verification

1. Create a test account through `/register`, verify the Login success message, and check that a duplicate email displays an error.
2. Visit `/dashboard` while logged out and verify redirection to `/login`.
3. Submit an incorrect password and verify the error message.
4. Sign in correctly, verify Dashboard loads, and refresh to verify the session persists.
5. Use Logout, then revisit `/dashboard` and verify login is required again.
6. Check navigation and both authentication forms at a narrow mobile width.
   Verify that Menu opens the navigation drawer, links close it, and Escape returns focus to Menu. On desktop, verify that the sidebar remains beside the page content.
7. Complete a Dashboard task, expand Completed tasks, and uncheck it to restore it. Check the empty state after completing all tasks.
8. Visit Home while logged out and verify the introductory checklist, footer team credit, and account links. If task loading fails, verify that the error stays visible while Technical details starts collapsed.
9. Toggle Dark mode with the mouse and keyboard. Navigate between app and authentication pages, then reload to verify that the preference persists. Check task rows, inputs, landing page, and sidebar labels in both themes at desktop and mobile widths.

## Working together

Pull the latest main before starting work, create a branch for your task, and open a pull request when ready:

```sh
git switch main
git pull
git switch -c feature/your-task
```

Commit `package-lock.json` when dependencies change. Do not commit `node_modules/`, `dist/`, or local `.env` files. Run `npm run lint` and `npm run build` before opening a pull request.
