import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import ChristmasTrivia from './pages/Christmas';

// Add more game pages as needed

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path= "christmas" element= {<ChristmasTrivia/>} />
        {/* Add other routes */}
      </Routes>
    </Router>
  );
}

export default App;
