import React, { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Documents from './components/Documents';
import Home from './components/Home';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import RandomModal from './components/RandomModal';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Random modal popup logic
    const randomModalInterval = setInterval(() => {
      const shouldShow = Math.random() < 0.1; // 10% chance every 30 seconds
      if (shouldShow) {
        setShowModal(true);
      }
    }, 30000);

    return () => clearInterval(randomModalInterval);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <RandomModal show={showModal} onClose={() => setShowModal(false)} />
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/" element={<Home />} />
            <Route path="/documents" element={<Documents />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
