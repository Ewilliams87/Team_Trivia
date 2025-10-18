import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Homepage';
import Leaderboard from './pages/LeaderBoard';
import Settings from './pages/Settings';
import AdminAuth from './components/AdminAuth';
import GameMaster from './components/GameMaster';
import PlayerComponent from './pages/Player';

// Add more game pages as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path= "playercomponent" element= {<PlayerComponent/>} />
        <Route path="/admin" element={<AdminAuth />} />
        <Route path= "leaderboard" element= {<Leaderboard/>} />
        <Route path= "settings" element= {<Settings/>} />
        <Route path="/gamemaster" element={<GameMaster />} />

        {/* Add other routes */}
      </Routes>
    </Router>
  );
}

export default App;
