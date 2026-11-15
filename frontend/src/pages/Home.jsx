/*
  Home.jsx

  Creates the Home component for the top level Home route

  Created by: CJ Quintero
  Created on: 10/24/2026
*/

import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import Brand from '../components/Brand';
import ThemeToggle from '../components/theme/ThemeToggle';
import Footer from '../components/layout/Footer';

const exampleTasks = [
  { name: 'Discover Habitual', completed: true },
  { name: 'Create your account', completed: false },
  { name: 'Take one step toward a better you', completed: false },
];

function Home() {
  const { user, loading } = useAuth();

  if (loading) return <p role="status" className="p-6 text-muted">Checking your session...</p>;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-foreground">
      <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5 sm:px-10">
        <Link to="/" aria-label="Habitual home" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
          <Brand className="w-32 sm:w-40" />
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-4">
          <Link to="/login" className="rounded-md px-3 py-3 text-sm font-medium text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Log in</Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-16">
        <section aria-labelledby="home-heading" className="max-w-xl">
          <h1 id="home-heading" className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">Build better habits, one step at a time.</h1>
          <Link to="/register" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">Create an account</Link>
        </section>

        <section aria-labelledby="preview-heading" className="w-full max-w-md rounded-2xl border border-stroke bg-surface p-6 shadow-sm sm:p-8 lg:justify-self-end">
          <h2 id="preview-heading" className="text-2xl font-semibold tracking-tight">Your fresh start</h2>
          <ul className="mt-6 divide-y divide-stroke/40">
            {exampleTasks.map((task) => (
              <li key={task.name} className="flex items-center gap-3 py-4">
                <span aria-hidden="true" className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${task.completed ? 'border-accent bg-accent text-on-accent' : 'border-field-border'}`}>
                  {task.completed && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="m5 12 4 4L19 6" /></svg>}
                </span>
                <span className={task.completed ? 'text-muted line-through' : 'text-foreground'}>{task.name}</span>
                <span className="sr-only">{task.completed ? 'Completed' : 'Incomplete'}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Home;
