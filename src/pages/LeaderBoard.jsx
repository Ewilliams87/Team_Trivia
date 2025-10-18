// pages/Leaderboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [adminName, setAdminName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('adminAuth'));
    if (!authData) {
      navigate('/admin'); // redirect if not logged in
      return;
    }

    setAdminName(authData.name);

    // ✅ Fetch scores from backend
    fetch('http://localhost:3001/scores') // your Express endpoint
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const sorted = data.sort((a, b) => b.Score - a.Score); // descending
        setScores(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard. Please try again later.');
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

      {loading && <p>Loading leaderboard...</p>}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && scores.length === 0 && (
        <p>No scores yet. Play a game to be the first!</p>
      )}

      {!loading && !error && scores.length > 0 && (
        <ul>
          {scores.map((entry, index) => (
            <li key={index}>
              {index + 1}. {entry.Name} - {entry.Score} points
            </li>
          ))}
        </ul>
      )}

      <button className="trivia-button" onClick={() => navigate('/')}>
        Back to Main Page
      </button>

      <button
        className="trivia-button"
        style={{ marginTop: '10px', backgroundColor: '#e74c3c' }}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default Leaderboard;
