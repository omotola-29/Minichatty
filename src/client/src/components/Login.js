import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username);
    }
  };

  return (
    <div className="join-container">
      <header className="join-header">
        <h1>Mini Chat App</h1>
      </header>
      <main className="join-main">
        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-control">
            <input
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username..."
              required
            />
          </div>
          <button type="submit" className="btn">Join Chat</button>
        </form>
      </main>
    </div>
  );
};

export default Login;
