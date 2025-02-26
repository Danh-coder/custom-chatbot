import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Multi-User Chatbot
        </Link>
        
        <nav className="flex items-center">
          {user ? (
            <>
              <Link to="/chat" className="mx-2 text-gray-700 hover:text-blue-600">
                Chat
              </Link>
              <Link to="/instructions" className="mx-2 text-gray-700 hover:text-blue-600">
                Instructions
              </Link>
              <div className="mx-2 text-gray-600">
                Welcome, {user.username}
              </div>
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mx-2 text-gray-700 hover:text-blue-600">
                Login
              </Link>
              <Link to="/register" className="mx-2 text-gray-700 hover:text-blue-600">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
