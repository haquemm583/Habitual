# Habitual

A habit and task tracker built with React and Vite for our Internet Programming capstone.

## Getting started

Use Docker Desktop with its Linux engine running. Copy `.env.example` to `.env` and fill it in (see [Environment variables](#environment-variables)).

```sh
git clone https://github.com/haquemm583/Habitual.git
cd Habitual
docker compose up --build -d
```

Open http://localhost:9000. Source changes appear automatically. The backend health check is http://localhost:3000/api/health. See [Docker commands](#docker-commands) for container commands.

Vite proxies `/api` to `http://backend:3000` inside Docker. The production host must also route `/api` to the backend; Vite's development proxy is not part of the production build.

## Environment variables

Copy `.env.example` to `.env` and fill in these variables. Never commit `.env` or share its sensitive values.

| Variable | Description | Example | Modifiable | Sensitive |
| --- | --- | --- | --- | --- |
| `POSTGRES_USER` | Username for the PostgreSQL database. Postgres creates this user when the database volume is first created. | `habitual` | Yes, but changes only take effect after `docker compose down --volumes`, which deletes all data. | Yes |
| `POSTGRES_PASSWORD` | Password for the PostgreSQL user. Postgres sets it when the database volume is first created. | `change-me-to-a-strong-password` | Yes, but changes only take effect after `docker compose down --volumes`, which deletes all data. | Yes |
| `DATABASE_URL` | Connection string the backend uses to reach the database. Built from `POSTGRES_USER` and `POSTGRES_PASSWORD`. | `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/habitual` | No. Keep the default; the `db` host and `habitual` database name match `compose.yaml`. | Yes, it contains the password |
| `SESSION_SECRET` | Secret used to sign session cookies. Must be a random value of at least 32 characters, or the backend will not start. | Output of the command below | Yes. Changing it signs out every user. | Yes |
| `FRONTEND_ORIGIN` | Frontend origin allowed to send authentication and task requests. Defaults to `http://localhost:9000`. | `http://localhost:9000` | Yes, if the frontend is served from a different URL. | No |

Generate a `SESSION_SECRET` with this command, then paste the output into `.env`. It only needs Docker and works in PowerShell, Command Prompt, and macOS or Linux terminals:

```sh
docker run --rm node:26 node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

It prints a 64-character random hex string. Each person should generate their own secret.

## Docker commands

Run these from the project root. The `exec` and `logs` commands need the containers to be running.

| Command | Description |
| --- | --- |
| `docker compose up --build -d` | Build and start the frontend, backend, and database containers. The frontend and backend dev servers start automatically. |
| `docker compose up --build -d -V` | Rebuild after adding packages. `-V` recreates the `node_modules` volumes and keeps the database. |
| `docker compose exec frontend npm run lint` | Check frontend source code with Oxlint. |
| `docker compose exec frontend npm run build` | Build the frontend into `frontend/dist/`. |
| `docker compose stop frontend` | Stop the frontend dev server so port 9000 is free for a preview. |
| `docker compose run --rm -p 9000:9000 frontend npm run preview -- --port 9000` | Serve the built `frontend/dist/` at http://localhost:9000 to test the production build. Run the build and stop commands first. Press Ctrl+C to stop; `--rm` removes the temporary container. |
| `docker compose start frontend` | Restart the frontend dev server after previewing. |
| `docker compose logs -f frontend` | Follow frontend container logs. |
| `docker compose logs -f backend` | Follow backend container logs. |
| `docker compose down` | Stop and remove the containers. The database volume is kept. |
| `docker compose down --volumes` | Stop and remove the containers and volumes, deleting all database data. |

## Project structure

```text
backend/src/      Express routes, database pool, and session configuration
db/init/          PostgreSQL initialization scripts
frontend/
  public/         Static files, such as the favicon and branding images
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

## API endpoints

The backend runs at http://localhost:3000, and the frontend reaches it through the `/api` proxy. Request bodies are JSON and limited to 16 KB. Endpoints that require authentication need the session cookie set by `POST /api/auth/login` and return `401` without it. Non-GET requests from an origin other than `FRONTEND_ORIGIN` or `http://localhost:3000` return `403`.

| Method | Endpoint | Auth required | Description | Example request body | Expected status |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/api/health` | No | Check that the backend is running and can reach the database. | None | `200` ok, `503` database unavailable |
| `POST` | `/api/auth/register` | No | Create an account. Name must be 1 to 100 characters and password 8 to 128 characters. Returns the new user's `id`, `name`, and `email`. | `{"name": "Test User", "email": "test@example.com", "password": "Test-password-123!"}` | `201` created, `400` invalid fields, `409` email already exists |
| `POST` | `/api/auth/login` | No | Sign in and start a session. Returns the user's `id`, `name`, and `email` and sets the session cookie. | `{"email": "test@example.com", "password": "Test-password-123!"}` | `200` ok, `400` missing fields, `401` wrong email or password |
| `GET` | `/api/auth/me` | Yes | Get the signed-in user's `id`, `name`, and `email`. | None | `200` ok, `401` not signed in |
| `POST` | `/api/auth/logout` | No | End the current session. Deletes the session from the database and clears the session cookie. | None | `204` no content |
| `GET` | `/api/tasks` | Yes | List the signed-in user's tasks, oldest first. | None | `200` ok |
| `POST` | `/api/tasks` | Yes | Create a task. Name must be 1 to 200 characters; `completed` is optional and defaults to `false`. | `{"name": "Drink water"}` | `201` created, `400` invalid fields |
| `PATCH` | `/api/tasks/:id` | Yes | Update a task's name, completed status, or both. `PUT` works the same way. | `{"completed": true}` | `200` ok, `400` invalid ID or fields, `404` task not found |
| `DELETE` | `/api/tasks/:id` | Yes | Delete a task. | None | `204` no content, `400` invalid ID, `404` task not found |

Task responses contain `id`, `name`, `completed`, `milestoneId`, and `createdAt`. Unexpected server errors return `500`.

## Authentication

The backend provides `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`. Open `/register` or follow the Create account link on Login to register with a name, email, and password of 8 to 128 characters. Passwords are hashed with Argon2id. Registration returns to Login with a success message and the account email filled in. Sign in to start a session. Invalid fields and duplicate email addresses display errors; authenticated visitors to `/register` return to Dashboard.

Sessions are stored in PostgreSQL; the session table is created automatically. The browser receives an HTTP-only cookie that expires after 24 hours. `NODE_ENV=production` requires HTTPS for this cookie. `FRONTEND_ORIGIN` defaults to `http://localhost:9000` and controls which frontend origin may submit authentication and task requests.

React checks the current session when the app starts. Logged-out Dashboard visits redirect to Login, and successful login returns to Dashboard. Logout removes the server session and updates navigation. Session-check failures display an error and retry control instead of rendering Dashboard. The public landing page includes a headline, account links, an introductory checklist, and team credit in the footer. Signed-in visitors to Home go directly to Dashboard. Each user's tasks are stored in PostgreSQL and loaded through the tasks API.

Dashboard shows active tasks first and keeps completed tasks in a collapsed section with a count. Expand it to review tasks or uncheck an item to make it active again. Creating, renaming, completing, and deleting tasks are saved to the database, so changes persist across reloads. Technical task-loading error details expand on demand. Required registration fields and password guidance remain visible.

### Manual verification

1. Create a test account through `/register`, verify the Login success message, and check that a duplicate email displays an error.
2. Visit `/dashboard` while logged out and verify redirection to `/login`.
3. Submit an incorrect password and verify the error message.
4. Sign in correctly, verify Dashboard loads, and refresh to verify the session persists.
5. Use Logout, then revisit `/dashboard` and verify login is required again.
6. Check navigation and both authentication forms at a narrow mobile width.
   Verify that Menu opens the navigation drawer, links close it, and Escape returns focus to Menu. On desktop, verify that the sidebar remains beside the page content.
7. Create a task, rename it, mark it complete, and delete it, reloading the page after each step to verify the change persists. Sign in as a different account and verify the first account's tasks are not shown.
8. Complete a Dashboard task, expand Completed tasks, and uncheck it to restore it. Check the empty state after completing all tasks.
9. Visit Home while logged out and verify the introductory checklist, footer team credit, and account links. If task loading fails, verify that the error stays visible while Technical details starts collapsed.
10. Toggle Dark mode with the mouse and keyboard. Navigate between app and authentication pages, then reload to verify that the preference persists. Check task rows, inputs, landing page, and sidebar labels in both themes at desktop and mobile widths.

## Working together

Pull the latest main before starting work, create a branch for your task, and open a pull request when ready:

```sh
git switch main
git pull
git switch -c feature/your-task
```

Commit `package-lock.json` when dependencies change. Do not commit `node_modules/`, `dist/`, or local `.env` files. Run `docker compose exec frontend npm run lint` and `docker compose exec frontend npm run build` before opening a pull request.
