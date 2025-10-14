// components/TriviaGame.js

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Triviagame.css';

const QUESTION_TIME = 8; // seconds

const TriviaGame = ({ fetchQuestions, categoryName }) => {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);


  const navigate = useNavigate();


  useEffect(() => {
    const loadQuestions = async () => {
      const data = await fetchQuestions();
      setQuestions(data);
    };
    loadQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (timeLeft <= 0) {
      nextQuestion();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleAnswer = (selected) => {
  setSelectedAnswer(selected);

  const isCorrect = selected === questions[current].answer;
  if (isCorrect) {
    setScore((s) => s + 1);
  }

  setTimeout(() => {
    nextQuestion();
    setSelectedAnswer(null);
  }, 1000);
};


  const nextQuestion = () => {
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
      setTimeLeft(QUESTION_TIME);
    } else {
      setGameOver(true);
    }
  };

  if (questions.length === 0) return <p>Loading questions...</p>;
 if (gameOver)
  return (
    <div className="trivia-container">
      <h2>{categoryName} - Game Over!</h2>
      <p className="score">Your score: {score} / {questions.length}</p>

      {!submitted ? (
        <div className="name-form">
          <p>Enter your name to save your score:</p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Your name"
          />
          <button
            className="trivia-button"
            onClick={() => {
              if (playerName.trim()) {
                // Save to localStorage
                const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
                leaderboard.push({ name: playerName, score });
                localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
                setSubmitted(true);
              }
            }}
          >
            Submit Score
          </button>
        </div>
      ) : (
        <>
          <p>Thanks, {playerName}! Your score has been saved.</p>
          <div className="button-group">
            <button className="trivia-button" onClick={() => navigate('/')}>
              Back to Main Page
            </button>
            
          </div>
        </>
      )}
    </div>
  );
<button className="trivia-button" onClick={() => navigate('/leaderboard')}>
              View Leaderboard
            </button>

  const q = questions[current];

  return (
  <div className="trivia-container">
    <h1>{categoryName} Trivia</h1>
    <p className="timer"><strong>Time Left:</strong> {timeLeft}s</p>
    <h2>{q.question}</h2>
    <div className="options">
  {q.options.map((opt, i) => {
    const labels = ['A', 'B', 'C', 'D'];
    const isCorrect = opt === q.answer;
    const isSelected = selectedAnswer === opt;

    let buttonClass = '';
    if (selectedAnswer) {
      if (isSelected && isCorrect) buttonClass = 'correct';
      else if (isSelected && !isCorrect) buttonClass = 'incorrect';
      else if (isCorrect) buttonClass = 'correct'; // show the correct one
    }

    return (
      <button
        key={i}
        className={buttonClass}
        onClick={() => handleAnswer(opt)}
        disabled={!!selectedAnswer}
      >
        <strong>{labels[i]}.</strong> {opt}
      </button>
    );
  })}
</div>

  </div>
);

};

export default TriviaGame;
