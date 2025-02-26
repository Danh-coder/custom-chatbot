import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const HomePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Multi-User Chatbot</h1>
        <p className="text-xl text-gray-600 mb-8">
          A personalized AI assistant with custom instructions for each user
        </p>
        
        {user ? (
          <div className="space-y-6">
            <p className="text-lg">
              Hello, <span className="font-semibold">{user.username}</span>! Ready to chat?
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/chat"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Start Chatting
              </Link>
              <Link
                to="/instructions"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Manage Instructions
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-lg">
              Sign in to start using your personalized AI assistant
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                to="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition duration-200"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Personalized Experience</h2>
          <p className="text-gray-600">
            Create custom instructions to tailor the AI's responses to your specific needs and preferences.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Multi-User Support</h2>
          <p className="text-gray-600">
            Each user has their own account with private conversations and personalized settings.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Real-time Chat</h2>
          <p className="text-gray-600">
            Enjoy seamless conversations with our AI assistant powered by WebSockets for instant responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
