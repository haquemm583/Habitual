# Habitual

A habit and task tracker built with React and Vite for our Internet Programming capstone.

## Getting started

Use Node.js 22.12 or newer (Node 22 LTS recommended) and npm.

```sh
git clone https://github.com/haquemm583/Habitual.git
cd Habitual
npm install
npm run dev
```

Open the local URL printed in the terminal. Source changes appear automatically. Press Ctrl+C to stop the server.

## Commands

- `npm run dev`: start the development server.
- `npm run build`: build the app into `dist/`.
- `npm run preview`: preview the production build locally after building.
- `npm run lint`: check source code with Oxlint.

## Project structure

```text
public/           Static files; planned location for data/habits.json
src/
  components/     Reusable presentation elements, such as the navbar
  pages/          Routed pages, such as Home, Dashboard, and About
  App.jsx         App entry component
  App.css         App styles
  index.css       Global styles
  main.jsx        React root
```

The empty component and page folders contain `.gitkeep` files so Git tracks them. Remove each placeholder when adding the first real file to its folder.

## Next team tasks for the lab

- Install `react-router-dom` and add Home (`/`), Dashboard (`/dashboard`), and About (`/about`) routes.
- Build a shared navbar with `Link` or `NavLink` that stays visible across pages without browser reloads.
- Add a structured mock habit array at `public/data/habits.json`.
- Fetch `/data/habits.json` in the Dashboard using `useEffect` and display the results, with loading and error states.
- Add team names to About and verify navigation and the data request.

This initial commit provides the React starter and folder structure. Routing, data fetching, authentication, and persistent storage are not implemented yet.

## Working together

Pull the latest main before starting work, create a branch for your task, and open a pull request when ready:

```sh
git switch main
git pull
git switch -c feature/your-task
```

Commit `package-lock.json` when dependencies change. Do not commit `node_modules/`, `dist/`, or local `.env` files. Run `npm run lint` and `npm run build` before opening a pull request.
