import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-blue-600 flex-shrink-0"
          >
            MessPal
          </Link>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/chat"
                  className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Chat
                </Link>
                <Link
                  to="/instructions"
                  className="text-gray-700 hover:text-blue-600 px-2 py-1 rounded hover:bg-gray-100"
                >
                  Instructions
                </Link>
                <div className="ml-4 text-gray-600 px-2">
                  Welcome, {user.username}
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Mobile Navigation Menu */}
        {menuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              {user ? (
                <>
                  <div className="text-gray-600 font-medium py-2">
                    Welcome, {user.username}
                  </div>
                  <Link
                    to="/chat"
                    className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-gray-100"
                    onClick={closeMenu}
                  >
                    Chat
                  </Link>
                  <Link
                    to="/instructions"
                    className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-gray-100"
                    onClick={closeMenu}
                  >
                    Instructions
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left mt-2 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-gray-100"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="text-gray-700 hover:text-blue-600 py-2 px-3 rounded hover:bg-gray-100"
                    onClick={closeMenu}
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
