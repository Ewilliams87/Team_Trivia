// pages/PlayerComponent.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { BACKEND_URL } from '../config';
import './player.css';
import confetti from 'canvas-confetti';

// --- Socket setup ---
const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
const QUESTION_TIME = 8;

const PlayerComponent = () => {
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [score, setScore] = useState(0);

  const [question, setQuestion] = useState(null);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  // --- Load from localStorage ---
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      const savedId = localStorage.getItem(`playerId_${savedName}`) || uuidv4();
      setPlayerName(savedName);
      setPlayerId(savedId);
      setIsRegistered(true);
      localStorage.setItem(`playerId_${savedName}`, savedId);

      if (socket.connected) {
        socket.emit('join-game', { name: savedName, playerId: savedId, isMaster: false });
        savePlayerToFirestore(savedId, savedName); // save to Firestore
      }
    }
  }, []);

  // --- Socket listeners ---
  useEffect(() => {
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      if (isRegistered && playerName && playerId) {
        socket.emit('join-game', { name: playerName, playerId, isMaster: false });
        savePlayerToFirestore(playerId, playerName);
        console.log('🎮 Player re-joined game:', { name: playerName, playerId });
      }
    });

    socket.on('new-question', ({ question, duration }) => {
      console.log('📩 Player received question:', question);
      setQuestion(question);
      setTimer(duration || QUESTION_TIME);
      setSelectedOption('');
      setIsLocked(false);
    });

    return () => {
      socket.off('connect');
      socket.off('new-question');
    };
  }, [isRegistered, playerName, playerId]);

  // --- Countdown timer ---
  useEffect(() => {
    if (!question || timer <= 0) return;

    const t = setTimeout(() => setTimer((prev) => prev - 1), 1000);

    if (timer === 1) {
      setIsLocked(true);
      const isCorrect = selectedOption === question.answer;

      socket.emit('question-ended', { playerId, selectedOption });

      if (isCorrect) saveScore(1, question.category || 'General');

      setTimeout(() => setQuestion(null), 500);
    }

    return () => clearTimeout(t);
  }, [timer, selectedOption, question]);

  // --- Save player to Firestore ---
  const savePlayerToFirestore = async (id, name) => {
    try {
      await fetch(`${BACKEND_URL}/save-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: id, name }),
      });
      console.log('✅ Player saved to Firestore:', { id, name });
    } catch (err) {
      console.error('❌ Error saving player:', err);
    }
  };

  // --- Save score ---
  const saveScore = async (points = 0, category = 'General') => {
    if (!playerName || !playerId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/save-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, name: playerName, score: points, category }),
      });
      const data = await res.json();
      console.log('✅ Score saved:', data);
      if (points > 0) setScore((prev) => prev + points);
    } catch (err) {
      console.error('❌ Error saving score:', err);
    }
  };

  // --- Register player ---
  const handleRegister = async () => {
    if (!playerName.trim()) return alert('Please enter your name.');

    const newId = uuidv4();
    setPlayerId(newId);
    localStorage.setItem('playerName', playerName);
    localStorage.setItem(`playerId_${playerName}`, newId);
    setIsRegistered(true);

    if (!socket.connected) socket.connect();

    socket.emit('join-game', { name: playerName, playerId: newId, isMaster: false });
    console.log('🎮 Player joined game:', { name: playerName, playerId: newId });

    await savePlayerToFirestore(newId, playerName); // Save to Firestore
    await saveScore(0, 'General'); // Initialize score
  };

  // --- Handle option click ---
  const handleOptionClick = (option) => {
    if (isLocked || !question) return;

    setSelectedOption(option);
    setIsLocked(true);

    if (option === question.answer) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    socket.emit('submit-answer', { answer: option, playerId });
  };

  // --- Logout ---
  const logout = () => {
    localStorage.removeItem('playerName');
    localStorage.removeItem(`playerId_${playerName}`);
    window.location.reload();
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
          <button className="home-btn" onClick={logout}>Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-container">
      <h1>Welcome, {playerName}</h1>
      <p>Score: {score}</p>
      <p className="timer">⏱ Time Remaining: {timer}s</p>

      {!question ? (
        <p className="waiting-text">Waiting for the Game Master to start...</p>
      ) : (
        <div className="question-card">
          <h2>{question.Question || question.question}</h2>
          <div className="options-grid">
            {question.options?.map((opt, idx) => (
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
            <p className="locked-text">
              You chose: <strong>{selectedOption}</strong>
            </p>
          )}
        </div>
      )}

      <button className="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
};

export default PlayerComponent;
