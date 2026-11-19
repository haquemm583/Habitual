/*
  Dashboard.jsx

  Creates the User Home page, which is the signed-in landing page. 
  The Home page will send signed-in users here, 
  that way the button within Home can stay the same without having to change where the Home button is. 


  Created by: Joseph Duff
  Created on: 11/19/2026

*/

import { Link } from 'react-router-dom'; 
import { useAuth } from '../auth/AuthContext'; 

function UserHome() {
    const { user } = useAuth(); 

     return (
        <div className="page user-home-page flex min-h-[70vh] flex-col items-center jestify-center text-center">
        <h2 className="my-[0.83em] text-2xl font-bold">
            {user?.name ? `Welcome back, ${user.name}` : 'Welcome back'}
        </h2>

        <section aria-labelledby="about-heading" className="mt-6 w-full max-w-2xl rounded-2xl border border-stroke bg-surface p-6 shadow-sm sm:p-8">
            <h3 id="about-heading" className="text-xl font-semibold tracking-tight">About Habitual</h3>
            <p className="mt-4 text-left text-muted">
            Habitual is a habit and task tracker built with React and Vite for our team's
            Internet Programming project. Create tasks and/or habits, check them off as you
            complete them, and come back anytime to pick up where you left off. 
            </p>
            <p className="mt-4 text-left text-muted">
            Your habits/tasks/milestone are saved to your account, so they stay with you across
            sessions and are visible only to you.
            </p>
            <p className="mt-4 text-left text-muted">
            Our goal is to help our users break bad habits while keeping track of and maintaining good habits.
            </p>
        </section>

        <Link
            to="/dashboard"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">
            Continue to Dashboard
        </Link>
        </div>
    );
}

export default UserHome;
