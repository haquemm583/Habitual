/*
  NotFound.jsx

  Creates the NotFound component for the top level NotFound route.
  This is shown when entering a random page into the url that isn't
  supported

  Created by: CJ Quintero
  Created on: 10/24/2026

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { useAuth } from '../auth/AuthContext';
import NavigationLink from '../components/NavigationLink';

function NotFound() {
  const { user } = useAuth();

  return (
    <div className="page not-found-page">
      <h2 className="my-[0.83em] text-2xl font-bold">Page not found!</h2>
      <NavigationLink to={user ? '/' : '/welcome'} back>{user ? 'Back to Today' : 'Back to welcome'}</NavigationLink>
    </div>
  );
}

export default NotFound;
