/*
  About.jsx

  Creates the Login component for the top level Login route

  Created by: Joseph Duff
  Created on: 10/25/2026
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
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
