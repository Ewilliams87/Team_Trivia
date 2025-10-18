// pages/PlayerComponent.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { BACKEND_URL } from '../config';
import './Player.css';
import confetti from 'canvas-confetti';

const socket = io(BACKEND_URL);

const PlayerComponent = () => {
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // Generate or load a UUID for the player
  const [playerId, setPlayerId] = useState(() => {
    const savedId = localStorage.getItem('playerId');
    if (savedId) return savedId;
    const newId = uuidv4();
    localStorage.setItem('playerId', newId);
    return newId;
  });

  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // --- Socket listeners ---
  useEffect(() => {
    const handleQuestion = (data) => {
      console.log('%c[SOCKET] Received question:', 'color: cyan; font-weight: bold;', data);

      setQuestion(data.question);
      setTimer(data.duration);
      setSelectedOption('');
      setIsLocked(false);
    };

    const handleGameUpdate = (update) => {
      console.log('%c[SOCKET] Game update received:', 'color: yellow;', update);
    };

    socket.on('new-question', handleQuestion);
    socket.on('game-update', handleGameUpdate);

    return () => {
      socket.off('new-question', handleQuestion);
      socket.off('game-update', handleGameUpdate);
    };
  }, []);

  // --- Countdown Timer ---
  useEffect(() => {
    if (timer <= 0) return;

    const t = setTimeout(() => setTimer(timer - 1), 1000);

    if (timer === 1) {
      setIsLocked(true);

      const isCorrect = selectedOption && question && selectedOption === question.Answer;

      if (isCorrect) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      socket.emit('question-ended');

      // --- Update score sheet using UUID ---
      if (isCorrect) {
        fetch(`${BACKEND_URL}/save-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId, // use UUID
            name: playerName,
            score: 1, // increment by 1 for correct answer
            category: question.Category || 'General'
          })
        })
        .then(res => res.json())
        .then(data => console.log('Score saved:', data))
        .catch(err => console.error('Error saving score:', err));
      }
    }

    return () => clearTimeout(t);
  }, [timer, selectedOption, question]);

  // --- Option click ---
  const handleOptionClick = (option) => {
    if (isLocked) return;
    setSelectedOption(option);
    setIsLocked(true);
    socket.emit('submit-answer',{answer: option, playerId});
  };

  // --- Register player ---
  const handleRegister = () => {
    if (!playerName.trim()) return alert('Please enter your name.');
    setIsRegistered(true);
    socket.emit('join-game', { name: playerName, playerId, isMaster: false });

    // Add player to score sheet immediately with 0 points
    fetch(`${BACKEND_URL}/save-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerId, // use UUID
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
          <p className="timer">⏱ Time Remaining: {timer}s</p>
          {isLocked && selectedOption && (
            <p className="locked-text">You chose: <strong>{selectedOption}</strong></p>
          )}
        </div>
      )}
      <button
        className="logout-btn"
        onClick={() => {
          localStorage.removeItem('playerName');
          localStorage.removeItem('playerId');
          window.location.reload();
        }}
      >
        Logout
      </button>
    </div>
  );
};

export default PlayerComponent;
