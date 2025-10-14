import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Homepage';
import ChristmasTrivia from './pages/Christmas';
import Leaderboard from './pages/LeaderBoard';

// Add more game pages as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path= "christmas" element= {<ChristmasTrivia/>} />
        <Route path= "leaderboard" element= {<Leaderboard/>} />

        {/* Add other routes */}
      </Routes>
    </Router>
  );
}

export default App;
