import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Triviagame.css';
import { BACKEND_URL } from '../config';

const QUESTION_TIME = 8; // seconds

const TriviaGame = ({ fetchQuestions, categoryName }) => {
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [endedEarly, setEndedEarly] = useState(false);

  const navigate = useNavigate();


  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      const data = await fetchQuestions();
      setQuestions(data);
    };
    loadQuestions();
  }, [fetchQuestions]);

  // Countdown timer
  useEffect(() => {
    if (!started || gameOver) return;
    if (timeLeft <= 0) {
      nextQuestion();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, started, gameOver]);

  const handleAnswer = (selected) => {
    setSelectedAnswer(selected);
    const isCorrect = selected === questions[current].answer;
    if (isCorrect) setScore((s) => s + 1);

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

  const confirmEndGame = () => setShowEndModal(true);
  const handleConfirmEnd = () => {
    setShowEndModal(false);
    setEndedEarly(true);
    setGameOver(true);
  };
  const handleCancelEnd = () => setShowEndModal(false);

  // ✅ Save score using your backend
const saveScore = async () => {
  console.log('Attempting to save score:', { name: playerName, score, category: categoryName });

  try {
    const res = await fetch(`${BACKEND_URL}/save-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerName,
        score,
        category: categoryName,
      }),
    });

    const data = await res.json();
    console.log('✅ Score saved via backend:', data);
    setSubmitted(true);
  } catch (err) {
    console.error('❌ Error saving score:', err);
    alert('Error saving score, please try again.');
  }
};


  if (questions.length === 0) return <p>Loading questions...</p>;

  if (!started) {
    return (
      <div className="trivia-container">
        <h1>{categoryName} Trivia</h1>
        <p>Please enter your name to begin:</p>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Your name"
          className="name-input"
        />
        <button
          className="trivia-button"
          disabled={!playerName.trim()}
          onClick={() => setStarted(true)}
        >
          Start Game
        </button>
        <button className="trivia-button" onClick={() => navigate('/')}>
          Home
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="trivia-container">
        <h2>{categoryName} - Game Over!</h2>
        <p className="score">
          {playerName}, your score: {score} / {questions.length}
        </p>

        {!submitted && !endedEarly ? (
          <div className="name-form">
            <button className="trivia-button" onClick={saveScore}>
              Save Score
            </button>
          </div>
        ) : endedEarly ? (
          <>
            <p>Your game was ended early. Score not saved.</p>
            <button className="trivia-button" onClick={() => navigate('/')}>
              Back to Main Page
            </button>
          </>
        ) : (
          <>
            <p>Thanks, {playerName}! Your score has been saved.</p>
            <button className="trivia-button" onClick={() => navigate('/')}>
              Back to Main Page
            </button>
          </>
        )}
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="trivia-container">
      <h1>{categoryName} Trivia</h1>
      <p><strong>Player:</strong> {playerName}</p>
      <p className="timer"><strong>Time Left:</strong> {timeLeft}s</p>
      <h2>{q.question}</h2>

      <div className="options">
        {q.options.map((opt, i) => {
          const labels = ['A', 'B', 'C', 'D'];
          const isSelected = selectedAnswer === opt;
          const isCorrect = opt === q.answer;

          let buttonClass = '';
          if (selectedAnswer) {
            if (isSelected && isCorrect) buttonClass = 'correct';
            else if (isSelected && !isCorrect) buttonClass = 'incorrect';
            else if (isCorrect) buttonClass = 'correct';
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

      <button className="trivia-button end-game-button" onClick={confirmEndGame}>
        End Game
      </button>

      {showEndModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>End Game?</h3>
            <p>Are you sure you want to end the game now?</p>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleConfirmEnd}>
                Yes, End Game
              </button>
              <button className="cancel-btn" onClick={handleCancelEnd}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriviaGame;
