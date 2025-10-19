// pages/PlayerComponent.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { BACKEND_URL } from '../config';
import './player.css';
import confetti from 'canvas-confetti';

const socket = io(BACKEND_URL);

const PlayerComponent = () => {
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

const [playerId, setPlayerId] = useState(() => {
  const savedName = localStorage.getItem('playerName');
  if (savedName) {
    const savedId = localStorage.getItem(`playerId_${savedName}`);
    if (savedId) return savedId;
  }
  const newId = uuidv4();
  return newId;
});



  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // --- Socket listeners ---
  useEffect(() => {
    const handleQuestion = (data) => {

      setQuestion(data.question);
      setTimer(data.duration);
      setSelectedOption('');
      setIsLocked(false);
    };

    const handleGameUpdate = (update) => {
    };

    socket.on('new-question', handleQuestion);
    socket.on('game-update', handleGameUpdate);

    return () => {
      socket.off('new-question', handleQuestion);
      socket.off('game-update', handleGameUpdate);
    };
  }, []);

  // --- Countdown Timer ---
  // --- Countdown Timer ---
useEffect(() => {
  if (timer <= 0) return;

  const t = setTimeout(() => setTimer(timer - 1), 1000);

  if (timer === 1) {
    setIsLocked(true);

    const isCorrect = selectedOption && question && selectedOption === question.Answer;

    socket.emit('question-ended');

    if (isCorrect) {
      fetch(`${BACKEND_URL}/save-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          name: playerName,
          score: 1,
          category: question.Category || 'General'
        })
      })
      .then(res => res.json())
      .then(data => console.log('Score saved:', data))
      .catch(err => console.error('Error saving score:', err));
    }

    // Wait 500ms before clearing question so confetti shows
    setQuestion(null)
  }

  return () => clearTimeout(t);
}, [timer, selectedOption, question]);


  // --- Option click ---
const handleOptionClick = (option) => {
  if (isLocked) return;

  setSelectedOption(option);
  setIsLocked(true);

  // Determine correctness immediately
  const isCorrect = question && option === question.Answer;

  // Trigger confetti immediately if correct
  if (isCorrect) {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }

  // Send answer to server
  socket.emit('submit-answer', { answer: option, playerId });
};

const logout = () => {
 
  window.location.href = '/';
};





  // --- Register player ---
  const handleRegister = () => {
  if (!playerName.trim()) return alert('Please enter your name.');

  // Save name & ID to localStorage
  localStorage.setItem('playerName', playerName);
  localStorage.setItem(`playerId_${playerName}`, playerId);

  setIsRegistered(true);

  socket.emit('join-game', { name: playerName, playerId, isMaster: false });

  // Add player to score sheet
  fetch(`${BACKEND_URL}/save-score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerId,
      name: playerName,
      score: 0,
      category: 'General'
    })
  })
    .then(res => res.json())
    .then(data => console.log('Player added to score sheet:', data))
    .catch(err => console.error('Error adding player to score sheet:', err));
};


  // --- Render ---
  if (!isRegistered) {
    return (
      <div className="player-container">
        <h1>Enter Your Name</h1>
        <input
          type="text"
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <div className="join-buttons">
          <button onClick={handleRegister}>Join Game</button>
          <button
            className="home-btn"
            onClick={() => {
              localStorage.removeItem('playerName');
              window.location.href = '/';
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-container">
      <h1>Welcome, {playerName}</h1>
<p className="timer">⏱ Time Remaining: {timer}s</p>
      {!question ? (
        <p className="waiting-text">Waiting for the Game Master to start the round...</p>
      ) : (
        <div className="question-card">
          <h2>{question.question}</h2>
          <div className="options-grid">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                className={`option-btn ${selectedOption === opt ? 'selected' : ''}`}
                onClick={() => handleOptionClick(opt)}
                disabled={isLocked}
              >
                {opt}
              </button>
            ))}
          </div>
          
          {isLocked && selectedOption && (
            <p className="locked-text">You chose: <strong>{selectedOption}</strong></p>
          )}
        </div>
      )}
      <button className="logout-btn" onClick={logout}>
  Logout
</button>
    </div>
  );
};

export default PlayerComponent;
