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

Styling uses Tailwind CSS through its Vite plugin. Add utility classes directly to JSX `className` attributes; `src/index.css` only imports Tailwind. No separate Tailwind or PostCSS configuration is needed.

## Authentication

The backend provides `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`. Open `/register` or follow the Create account link on Login to register with a name, email, and password of 15 to 128 characters. Passwords are hashed with Argon2id. Registration returns to Login with a success message and the account email filled in. Sign in to start a session. Invalid fields and duplicate email addresses display errors; authenticated visitors to `/register` return to Dashboard.

Sessions are stored in PostgreSQL; the session table is created automatically. The browser receives an HTTP-only cookie that expires after 24 hours. `NODE_ENV=production` requires HTTPS for this cookie. `FRONTEND_ORIGIN` defaults to `http://localhost:9000` and controls which frontend origin may submit authentication requests.

React checks the current session when the app starts. Logged-out Dashboard visits redirect to Login, and successful login returns to Dashboard. Logout removes the server session and updates navigation. Session-check failures display an error and retry control instead of rendering Dashboard. Home and About remain public. Dashboard still displays shared mock tasks; per-user task storage is not implemented.

### Manual verification

1. Create a test account through `/register`, verify the Login success message, and check that a duplicate email displays an error.
2. Visit `/dashboard` while logged out and verify redirection to `/login`.
3. Submit an incorrect password and verify the error message.
4. Sign in correctly, verify Dashboard loads, and refresh to verify the session persists.
5. Use Logout, then revisit `/dashboard` and verify login is required again.
6. Check navigation and both authentication forms at a narrow mobile width.

## Working together

Pull the latest main before starting work, create a branch for your task, and open a pull request when ready:

```sh
git switch main
git pull
git switch -c feature/your-task
```

Commit `package-lock.json` when dependencies change. Do not commit `node_modules/`, `dist/`, or local `.env` files. Run `npm run lint` and `npm run build` before opening a pull request.
