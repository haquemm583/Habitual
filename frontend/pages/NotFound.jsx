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
      <h2 className="my-[0.83em] text-2xl font-bold">Page not found!</h2>
      <Link className="text-[#0000ee] underline visited:text-[#551a8b]" to="/">Click here to go back to the home page.</Link>
    </div>
  );
}

export default NotFound;
