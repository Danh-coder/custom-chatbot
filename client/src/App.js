import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import ChatPage from './pages/ChatPage';
import InstructionsPage from './pages/InstructionsPage';
import PrivateRoute from './components/PrivateRoute';

// Component to conditionally render header
const AppContent = () => {
  const location = useLocation();
  const isChatPage = location.pathname === '/chat';
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {!isChatPage && <Header />}
      <main className={`flex-grow container mx-auto ${isChatPage ? 'py-0' : 'py-6'}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/chat" 
            element={
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/instructions" 
            element={
              <PrivateRoute>
                <InstructionsPage />
              </PrivateRoute>
            } 
          />
        </Routes>
      </main>
      {!isChatPage && (
        <footer className="bg-white border-t py-4 text-center text-gray-600 text-sm">
          <div className="container mx-auto px-4">
            <p>© {new Date().getFullYear()} MessPal. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
