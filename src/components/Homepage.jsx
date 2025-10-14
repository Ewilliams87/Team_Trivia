import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css'; // Optional: styles in a separate file

const HomePage = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'All About Christmas', path: '/christmas' },
  ];

  return (
    <div className="homepage-container">
      <h1>Select Your Trivia Game</h1>
      <div className="button-container">
        {categories.map((cat) => (
          <button
            key={cat.path}
            className="game-button"
            onClick={() => navigate(cat.path)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
