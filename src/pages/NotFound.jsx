/*
  NotFound.jsx

  Creates the NotFound component for the top level NotFound route.
  This is shown when entering a random page into the url that isn't
  supported

  Created by: CJ Quintero
  Created on: 10/24/2026
*/
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="page not-found-page">
      <h2>Page not found!</h2>
      <Link to="/">Click here to go back to the home page.</Link>
    </div>
  );
}

export default NotFound;
