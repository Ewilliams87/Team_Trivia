import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../components/Homepage.css'; // Optional: styles in a separate file

const HomePage = () => {
  const navigate = useNavigate();

  const categories = [
    { name: 'Christmas', path: '/christmas' },
    // Add more categories here
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

        
       
       {/* Settings Button */}
       <button
          className="game-button settings-button"
          onClick={() => navigate('/settings')}
        >
          Settings
        </button>


      </div>
    </div>
  );
};

export default HomePage;
