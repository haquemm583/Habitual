/*
  Login.jsx

  Creates the Login component for the top level Login route

  Created by: Joseph Duff
  Created on: 10/25/2026

  Note: Currently this Login Page does not store the credentials 
        nor does it have any actionable purpose. 
  TODO: Create a link between Login Page and database 
        to have saved user information 

*/

import { useState } from 'react';

function Login() {
  /* these constants create two pieces of the state.
    
    - email: holding the value
    - setEmail: submitting a reqeust to update the state of the value, 
    - useState(''): initialized empty state
    
   */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  function handleSubmit(event) {
    // prevents the page from reloading before the submission is handled 
    event.preventDefault();
    console.log('Login submitted:', email);
  }

  return (
    <div className="page login-page">
      <h1 className="my-[0.83em] text-2xl font-bold">Login Page</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-2 block font-medium text-stone-900">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="min-h-16 w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block font-medium text-stone-900">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="min-h-16 w-full rounded-md border border-stone-200 bg-white px-4 py-3 text-stone-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
          />
        </div>

        <button type="submit"
        className="min-h-16 w-full cursor-pointer rounded-md border border-stone-200 bg-white px-4 py-3 font-medium text-stone-900 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800"
        >Login</button>
      </form>
    </div>
  );
}

export default Login;
