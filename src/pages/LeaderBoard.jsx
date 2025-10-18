import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import './Leaderboard.css';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
  const authData = JSON.parse(localStorage.getItem('adminAuth'));
  if (!authData) {
    navigate('/admin');
    return;
  }
  setAdminName(authData.name);

  // Show cached scores immediately
  const cachedScores = JSON.parse(localStorage.getItem('leaderboard') || '[]');
  if (cachedScores.length > 0) {
    setScores(cachedScores);
    setLoading(false);
  }

  // Fetch fresh scores in background
  fetch(`${BACKEND_URL}/scores`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((data) => {
      const sorted = data.sort((a, b) => b.Score - a.Score);
      setScores(sorted);
      localStorage.setItem('leaderboard', JSON.stringify(sorted)); // update cache
      setLoading(false);
    })
    .catch((err) => {
      console.error('Error fetching leaderboard:', err);
      if (!cachedScores.length) setError('Failed to load leaderboard. Please try again later.');
      setLoading(false);
    });
}, [navigate]);


  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin');
  };

  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      <p>Welcome, <strong>{adminName}</strong></p>

      {loading && <p className="loading">Loading leaderboard...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && scores.length === 0 && (
        <p>No scores yet. Play a game to be the first!</p>
      )}

      {!loading && !error && scores.length > 0 && (
        <ul>
          {scores.map((entry, index) => (
            <li key={index}>
              <span>{index + 1}. {entry.Name}</span>
              <span>{entry.Score} pts</span>
            </li>
          ))}
        </ul>
      )}

      <button className="trivia-button" onClick={() => navigate('/')}>
        Back to Main Page
      </button>
      <button className="trivia-button logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Leaderboard;
