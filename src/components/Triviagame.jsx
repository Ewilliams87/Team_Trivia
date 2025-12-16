// pages/TriviaGame.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BACKEND_URL } from '../config';
import './Triviagame.css';
import confetti from 'canvas-confetti';

const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'] });
const QUESTION_TIME = 8;

const TriviaGame = ({ categoryName }) => {
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Listen for new questions from the backend
  useEffect(() => {
    socket.on('new-question', ({ question, duration }) => {
      setCurrentQuestion(question);
      setTimeLeft(duration || QUESTION_TIME);
      setSelectedAnswer(null);
    });

    socket.on('game-over', () => setGameOver(true));

    // Backend sends score updates after answer submission
    socket.on('answer-result', ({ correct, score: newScore }) => {
      setScore(newScore);
      if (correct) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    });

    return () => {
      socket.off('new-question');
      socket.off('game-over');
      socket.off('answer-result');
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!started || gameOver || !currentQuestion) return;
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, started, currentQuestion, gameOver]);

  // Handle player answer
  const handleAnswer = (opt) => {
    if (selectedAnswer) return; // already answered
    setSelectedAnswer(opt);

    // Send answer to backend; backend determines correctness and updates score
    socket.emit('submit-answer', {
      player: playerName,
      answer: opt,
    });
  };

  // Save score manually to backend (optional)
  const saveScore = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/save-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName, score, category: categoryName }),
      });
      await res.json();
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Failed to save score');
    }
  };

  if (!started) {
    return (
      <div className="trivia-container">
        <h1>{categoryName} Trivia</h1>
        <input
          placeholder="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
        <button disabled={!playerName.trim()} onClick={() => setStarted(true)}>
          Join Game
        </button>
        <button onClick={() => navigate('/')}>Home</button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="trivia-container">
        <h1>Game Over</h1>
        <p>{playerName}, your score: {score}</p>
        {!submitted ? (
          <button onClick={saveScore}>Save Score</button>
        ) : (
          <p>Score saved!</p>
        )}
        <button onClick={() => navigate('/')}>Home</button>
      </div>
    );
  }

  if (!currentQuestion) return <p>Waiting for the game master to start...</p>;

  return (
    <div className="trivia-container">
      <h2>{currentQuestion.question}</h2>
      <p>Time left: {timeLeft}s</p>
      <div className="options">
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            disabled={!!selectedAnswer}
            className={
              selectedAnswer
                ? opt === currentQuestion.answer
                  ? 'correct'
                  : opt === selectedAnswer
                  ? 'incorrect'
                  : ''
                : ''
            }
            onClick={() => handleAnswer(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TriviaGame;
