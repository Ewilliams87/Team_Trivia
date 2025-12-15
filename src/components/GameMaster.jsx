// components/GameMasterDashboard.js
import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../config';
import './GameMasterDashboard.css';
import { v4 as uuidv4 } from 'uuid';


const socket = io(BACKEND_URL);

const GameMasterDashboard = () => {
  const navigate = useNavigate();
  const [adminName, setAdminName] = useState('Game Master');
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [timer, setTimer] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'leaderboard', 'players'
  const [correctPlayers, setCorrectPlayers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Static categories list (can manually add more)
  const categories = ['', 'Christmas', 'Halloween', 'Thanksgiving'];

  // Initialize questions cache from localStorage
  const [questionsCache, setQuestionsCache] = useState({});

  

  const [masterId] = useState(() => uuidv4());

  // --- Register Game Master once ---
 useEffect(() => {
  socket.emit('join-game', { name: adminName, isMaster: true, playerId: masterId });
}, []);
  // --- Load questions with cache ---
  useEffect(() => {
    const fetchQuestions = async (category = selectedCategory) => {
      if (questionsCache[category]) {
        setQuestions(questionsCache[category]); // use cached questions
        return;
      }

      try {
        const url =
          category === 'All'
            ? `${BACKEND_URL}/questions`
            : `${BACKEND_URL}/questions?category=${encodeURIComponent(category)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (Array.isArray(data)) {
          setQuestions(data);
          setQuestionsCache(prev => ({ ...prev, [category]: data })); // cache results
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
  }, [selectedCategory]); // removed questionsCache dependency

  // --- Filtered questions ---
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
      console.log('[SOCKET] Updated players:', playerList);
      setPlayers(playerList);
    };

    socket.on('players-update', handlePlayersUpdate);

    return () => {
      socket.off('players-update', handlePlayersUpdate);
    };
  }, []);

  // --- Timer countdown ---
  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  // --- Send question to players ---
  const sendQuestion = () => {
    if (!selectedQuestion) return alert('Please select a question to send.');

    setCorrectPlayers([]); // reset correct players

    socket.emit('sendingGame-question', { question: selectedQuestion, duration: 10 });
    setTimer(10);
  };

  // --- Listen for correct players ---
  useEffect(() => {
    const handleCorrectPlayers = (list) => {
      setCorrectPlayers(list);
    };

    socket.on('players-correct', handleCorrectPlayers);

    return () => {
      socket.off('players-correct', handleCorrectPlayers);
    };
  }, []);

  // --- Logout handler ---
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
          <h2>Select a Question</h2>
          <p>⏱ Timer: {timer}s</p>

          {/* Category Selector */}
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

          {/* Question List */}
          {filteredQuestions.length > 0 ? (
            <ul className="question-list">
              {filteredQuestions.map((q, index) => (
                <li
                  key={index}
                  className={`question-item ${selectedQuestion === q ? 'selected' : ''}`}
                  onClick={() => setSelectedQuestion(q)}
                >
                  <strong>Q{index + 1}:</strong> {q.Question}
                  <div className="question-category">📂 {q.Category}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No questions available for this category.</p>
          )}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button onClick={sendQuestion}>Send Selected Question</button>
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
          ) : (
            <p>No scores yet</p>
          )}
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
            ) : (
              <p>No players connected</p>
            )}
          </div>
        </div>
      )}

      {/* --- Correct Players Panel --- */}
      {activeTab === 'dashboard' && correctPlayers.length > 0 && (
        <div className="correct-players-panel">
          <h4>🎉 Players Who Answered Correctly:</h4>
          <ul>
            {correctPlayers.map((player, idx) => (
              <li key={idx}>
                {idx + 1}. {typeof player === 'string' ? player : player.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="trivia-button logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default GameMasterDashboard;
