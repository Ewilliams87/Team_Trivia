// pages/Leaderboard.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    // Sort by score descending
    data.sort((a, b) => b.score - a.score);
    setScores(data);
  }, []);

  return (
    <div className="leaderboard-container">
      <h1>Leaderboard</h1>
      {scores.length === 0 ? (
        <p>No scores yet. Play a game to be the first!</p>
      ) : (
        <ul>
          {scores.map((entry, index) => (
            <li key={index}>
              {index + 1}. {entry.name} - {entry.score} points
            </li>
          ))}
        </ul>
      )}
      <button className="trivia-button" onClick={() => navigate('/')}>
        Back to Main Page
      </button>
    </div>
  );
};

export default Leaderboard;
