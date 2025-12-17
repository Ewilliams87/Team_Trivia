// pages/PlayerComponent.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';
import './player.css';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../components/ConfirmationModal';


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
  const navigate = useNavigate();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'logout'




useEffect(() => {
  const savedName = localStorage.getItem('playerName');
  const savedId = localStorage.getItem('playerId');

  if (savedName && savedId) {
    setPlayerName(savedName);
    setPlayerId(savedId);
    setIsRegistered(true);

    // Join game immediately
    if (socket.connected) {
      socket.emit('join-game', { name: savedName, playerId: savedId, isMaster: false });
    }

    // Fetch score/question
    fetch(`${BACKEND_URL}/player-data?playerId=${savedId}`)
      .then(res => res.json())
      .then(data => {
        if (data.score !== undefined) setScore(data.score);
        if (data.currentQuestion) {
          setQuestion(data.currentQuestion.question);
          setTimer(data.currentQuestion.timeLeft || QUESTION_TIME);
        }
      })
      .catch(err => console.error(err));
  }
}, []);


// --- Handle socket events ---
  useEffect(() => {
    // On connect, join the game if registered
    socket.on('connect', () => {
      if (isRegistered && playerId && playerName) {
        socket.emit('join-game', { name: playerName, playerId, isMaster: false });
      }
    });

    // New question from backend
    socket.on('new-question', ({ question, duration }) => {
      setQuestion(question);
      if (question) {
        setTimer(duration || QUESTION_TIME);
        setSelectedOption('');
        setIsLocked(false);
      } else {
        setTimer(0);
        setSelectedOption('');
        setIsLocked(false);
      }
    });

    // Timer updates
    socket.on('timer-update', ({ timeLeft }) => setTimer(timeLeft));

    // Answer result
    socket.on('answer-result', ({ correct, score: newScore }) => {
      if (correct) {
        confetti({ particleCount: 100, spread: 30, origin: { y: 0.6 } });
      }
      setScore(newScore);
    });

    socket.on('question-ended', ({ finalScores }) => {
  setIsLocked(true);

  if (finalScores && playerId && finalScores[playerId] !== undefined) {
    setScore(finalScores[playerId]);
  }
});


    return () => {
      socket.off('connect');
      socket.off('new-question');
      socket.off('timer-update');
      socket.off('answer-result');
      socket.off('question-ended');
    };
  }, [isRegistered, playerName, playerId]);

  // --- Fetch player score and current question from backend on load ---
  useEffect(() => {
    if (!playerId) return;

    const fetchPlayerData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/player-data?playerId=${playerId}`);
        const data = await res.json();

        if (data.name) setPlayerName(data.name);
        if (data.score !== undefined) setScore(data.score);
        if (data.currentQuestion) {
          setQuestion(data.currentQuestion.question);
          setTimer(data.currentQuestion.timeLeft || QUESTION_TIME);
        }
        setIsRegistered(true);

        // Join game after fetching data
        if (socket.connected) {
          socket.emit('join-game', { name: data.name, playerId, isMaster: false });
        }
      } catch (err) {
        console.error('❌ Failed to fetch player data:', err);
      }
    };

    fetchPlayerData();
  }, [playerId]);

  // --- Register player ---
  const handleRegister = async () => {
  if (!playerName.trim()) return alert('Please enter your name');

  try {
    const res = await fetch(`${BACKEND_URL}/register-player`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName }),
    });
    const data = await res.json();

    if (!data.playerId) throw new Error('No playerId returned from server');

    // Save locally
    localStorage.setItem('playerName', playerName);
    localStorage.setItem('playerId', data.playerId);

    setPlayerId(data.playerId);
    setScore(data.score || 0);
    setIsRegistered(true);

    // Emit join only after playerId is guaranteed
    socket.emit('join-game', { name: playerName, playerId: data.playerId, isMaster: false });
  } catch (err) {
    console.error('❌ Registration failed:', err);
  }
};



  // --- Handle option click ---
  const handleOptionClick = (option) => {
    if (isLocked || !question) return;
    setSelectedOption(option);
    setIsLocked(true);
    socket.emit('submit-answer', { answer: option, playerId });
  };

  // --- Logout ---
  const logout = () => {
    setIsRegistered(false);
    setPlayerName('');
    setPlayerId('');
    setScore(0);
    setQuestion(null);
    setSelectedOption('');
    setIsLocked(false);

    localStorage.removeItem('playerName');
  localStorage.removeItem('playerId');
  };

  const goHome = () => {
  // Clear state
  setIsRegistered(false);
  setPlayerName('');
  setPlayerId('');
  setScore(0);
  setQuestion(null);
  setSelectedOption('');
  setIsLocked(false);

  // Remove saved player data
  localStorage.removeItem('playerName');
  localStorage.removeItem('playerId');

  navigate('/')
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
          <button onClick={goHome}>Home</button>
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
