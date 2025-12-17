// components/GameMasterDashboard.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import './GameMasterDashboard.css';
import { v4 as uuidv4 } from 'uuid';
import ConfirmationModal from './ConfirmationModal';

const socket = io(BACKEND_URL);

const GameMasterDashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Game Master');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [timer, setTimer] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [correctPlayers, setCorrectPlayers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAnswer, setShowAnswer] = useState(false);

  const categories = ['', 'Christmas', 'Halloween', 'Thanksgiving'];
  const [questionsCache, setQuestionsCache] = useState({});
  const [usedQuestions, setUsedQuestions] = useState(() => JSON.parse(localStorage.getItem('usedQuestions') || '[]'));
  const [masterId] = useState(() => uuidv4());
  const [modalVisible, setModalVisible] = useState(false);
const [modalAction, setModalAction] = useState(null); // 'logout' | 'newGame'

  const [lastAnswered, setLastAnswered] = useState(() => {
    const saved = localStorage.getItem('lastAnswered');
    return saved ? JSON.parse(saved) : null;
  });

  // --- Restore last question safely ---
  useEffect(() => {
    if (lastAnswered) {
      setSelectedQuestion(lastAnswered.question);
      setSelectedQuestionIndex(lastAnswered.index);

      if (lastAnswered.correctPlayers && lastAnswered.correctPlayers.length > 0) {
        setCorrectPlayers(lastAnswered.correctPlayers);
        setShowAnswer(true);
      } else {
        setCorrectPlayers([]);
        setShowAnswer(false);
      }
    }
  }, []);

  // --- Register Game Master ---
  useEffect(() => {
    socket.emit('join-game', { name: adminName, isMaster: true, playerId: masterId });
  }, []);

  // --- Load questions ---
  useEffect(() => {
    const fetchQuestions = async (category = selectedCategory) => {
      if (questionsCache[category]) {
        setQuestions(questionsCache[category]);
        return;
      }

      try {
        const url = category === 'All'
          ? `${BACKEND_URL}/questions`
          : `${BACKEND_URL}/questions?category=${encodeURIComponent(category)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data)) {
          setQuestions(data);
          setQuestionsCache(prev => ({ ...prev, [category]: data }));
        } else {
          console.error('Unexpected response format:', data);
          setQuestions([]);
        }
      } catch (err) {
        console.error('Error fetching questions:', err);
        setQuestions([]);
      }
    };

    fetchQuestions(selectedCategory);
  }, [selectedCategory]);

  const filteredQuestions = selectedCategory === 'All'
    ? questions
    : questions.filter(q => q.Category === selectedCategory);

  // --- Load leaderboard ---
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/scores`);
      const data = await res.json();
      const sorted = data.sort((a, b) => b.score - a.score);
      setLeaderboard(sorted);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  // --- Listen for connected players ---
  useEffect(() => {
    const handlePlayersUpdate = (playerList) => {
      setPlayers(playerList);
    };
    socket.on('players-update', handlePlayersUpdate);
    return () => socket.off('players-update', handlePlayersUpdate);
  }, []);

  // --- Timer countdown ---
  useEffect(() => {
    const handleTimerUpdate = ({ timeLeft }) => {
      setTimer(timeLeft);
      if (timeLeft === 0) setShowAnswer(true);
    };
    socket.on('timer-update', handleTimerUpdate);
    return () => socket.off('timer-update', handleTimerUpdate);
  }, []);

  // --- Listen for correct players ---
  useEffect(() => {
  const handleCorrectPlayers = (list) => {
    if (!lastAnswered) return;

    const updated = { ...lastAnswered, correctPlayers: list };
    setLastAnswered(updated);
    setCorrectPlayers(list);

    // Persist immediately
    localStorage.setItem('lastAnswered', JSON.stringify(updated));
  };

  socket.on('players-correct', handleCorrectPlayers);
  return () => socket.off('players-correct', handleCorrectPlayers);
}, [lastAnswered]);


  // --- Send question ---
  const sendQuestion = () => {
    if (!selectedQuestion) return alert('Please select a question to send.');

    setCorrectPlayers([]);
    setShowAnswer(false);

    socket.emit('sendingGame-question', {
      question: selectedQuestion,
      duration: 10
    });

    setTimer(10);

    const answered = {
      question: selectedQuestion,
      index: selectedQuestionIndex,
      correctPlayers: null // do NOT persist empty array yet
    };
    setLastAnswered(answered);
    localStorage.setItem('lastAnswered', JSON.stringify(answered));

    // Mark as used
    const key = selectedQuestion.id || selectedQuestion.Question;
    if (!usedQuestions.includes(key)) {
      const updated = [...usedQuestions, key];
      setUsedQuestions(updated);
      localStorage.setItem('usedQuestions', JSON.stringify(updated));
    }
  };

// --- Handlers for buttons ---
const handleNewGameClick = () => {
  setModalAction('newGame');
  setModalVisible(true);
};

const handleLogoutClick = () => {
  setModalAction('logout');
  setModalVisible(true);
};

const handleConfirm = () => {
  setModalVisible(false);
  if (modalAction === 'newGame') resetUsedQuestions(); // start a new round
  if (modalAction === 'logout') handleLogout();          // logout
};

const handleCancel = () => setModalVisible(false);



  // --- Reset used questions ---
  const resetUsedQuestions = () => {
    setUsedQuestions([]);
    localStorage.removeItem('usedQuestions');
    localStorage.removeItem('lastSelectedQuestion');
    localStorage.removeItem('lastSelectedQuestionIndex');
    localStorage.removeItem('lastAnswered');
    setSelectedQuestion(null);
    setSelectedQuestionIndex(null);
    setCorrectPlayers([]);
    setShowAnswer(false);
  };

  // --- Logout ---
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <h1>🎯 Game Master Dashboard</h1>
      <p>Welcome, <strong>{adminName}</strong></p>

      <div className="tabs">
        <button onClick={() => setActiveTab('dashboard')}>Questions</button>
        <button onClick={() => { setActiveTab('leaderboard'); fetchLeaderboard(); }}>Leaderboard</button>
        <button onClick={() => setActiveTab('players')}>Players</button>
      </div>

      {/* --- Questions Panel --- */}
      {activeTab === 'dashboard' && (
        <div className="dashboard-panel">
          <p><strong>⏱ Timer: {timer}s</strong></p>

          <div className="category-select">
            <label htmlFor="category">Choose a Category: </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {filteredQuestions.length > 0 ? (
            <ul className="question-list">
              {filteredQuestions.map((q, index) => (
                <li
                  key={index}
                  className={`question-item
                    ${selectedQuestion === q ? 'selected' : ''}
                    ${usedQuestions.includes(q.id || q.Question) ? 'used' : ''}`}
                  onClick={() => {
                    setSelectedQuestion(q);
                    setSelectedQuestionIndex(index);
                  }}
                >
                  <strong>Q{index + 1}:</strong> {q.Question}
                  <div className="question-category"> {q.Category}</div>
                  {usedQuestions.includes(q.id || q.Question) && (
                    <span className="used-badge">✔ Used</span>
                  )}
                </li>
              ))}
            </ul>
          ) : <p>No questions available for this category.</p>}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={sendQuestion}>Send Selected Question</button>
            <button onClick={handleNewGameClick}>🔄 New Game</button>
          </div>
        </div>
      )}

      {/* --- Leaderboard Panel --- */}
      {activeTab === 'leaderboard' && (
        <div className="leaderboard-panel">
          <h2>🏆 Leaderboard</h2>
          {leaderboard.length > 0 ? (
            <ul>
              {leaderboard.map((entry, idx) => (
                <li key={idx}>
                  <span>{idx + 1}. {entry.name}</span>
                  <span>{entry.score} pts</span>
                </li>
              ))}
            </ul>
          ) : <p>No scores yet</p>}
        </div>
      )}

      {/* --- Players Panel --- */}
      {activeTab === 'players' && (
        <div className="dashboard-panel">
          <div className='player-panel'>
            <h2>🧑‍🤝‍🧑 Connected Players</h2>
            {players.length > 0 ? (
              <ul>
                {players.map((player, idx) => (
                  <li key={idx}>
                    {idx + 1}. {player.name} {player.isMaster && '🎮 (Master)'} - {player.score} pts
                  </li>
                ))}
              </ul>
            ) : <p>No players connected</p>}
          </div>
        </div>
      )}

   {/* --- Correct Players Panel --- */}
{activeTab === 'dashboard' && lastAnswered && (
  <div className="correct-players-panel">
    <p style={{ color: '#111', fontWeight: 'bold' }}>
      Q{lastAnswered.index + 1} Correct Answer: <strong>{lastAnswered.question.Answer}</strong>
    </p>

    {lastAnswered.correctPlayers && lastAnswered.correctPlayers.length > 0 ? (
      <>
        <h4>🎉 Players Who Answered Correctly:</h4>
        <ul>
          {lastAnswered.correctPlayers.map((player, idx) => (
            <li key={idx}>
              {idx + 1}. {typeof player === 'string' ? player : player.name}
            </li>
          ))}
        </ul>
      </>
    ) : timer > 0 ? (
      <p style={{ fontStyle: 'italic', color: '#000' }}>⏳ Waiting for answers...</p>
    ) : (
      <p style={{ fontStyle: 'italic', color: '#000' }}>❌ No players answered correctly</p>
    )}
  </div>
)}




      <button className="trivia-button logout-button" onClick={handleLogoutClick}>
        Logout
      </button>
    <ConfirmationModal
  show={modalVisible}
  message={
    modalAction === 'logout'
      ? 'Are you sure you want to logout?'
      : 'Are you sure you want to start a new game?'
  }
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>

    </div>
    
  );
};

export default GameMasterDashboard;
