import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Home from './pages/Home/Home';
import './styles/globals.css';

function AppContent() {
  const { isDarkMode } = useTheme();
  
  return (
    <Router>
      <div className={`App ${isDarkMode ? 'dark' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
