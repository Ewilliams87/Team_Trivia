// components/AdminAuth.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './auth.css';
const AdminAuth = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Simple credentials (can be replaced or moved to .env)
  const ADMIN_CREDENTIALS = {
    name: 'admin',
    password: '1234', // change this
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (name === ADMIN_CREDENTIALS.name && password === ADMIN_CREDENTIALS.password) {
      localStorage.setItem('adminAuth', JSON.stringify({ name }));
      navigate('/gamemaster');
    } else {
      setError('Invalid name or password');
    }
  };

  return (
    <div className="auth-container">
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Admin name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="auth-input"
        />
        <button type="submit" className="trivia-button">
          Login
        </button>
        <button type="sumbit" className="trivia-button" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </form>

      {error && <p className="auth-error">{error}</p>}
    </div>
  );
};

export default AdminAuth;
