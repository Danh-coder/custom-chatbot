import React, { useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [selectedInstruction, setSelectedInstruction] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  const { user, token } = useContext(AuthContext);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      console.log('Connected to socket server');
      socketInstance.emit('authenticate', { userId: user.id });
    });

    socketInstance.on('message', (data) => {
      if (currentChat && data.chatId === currentChat._id) {
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }
      
      // Update the chat list to show this chat is updated
      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex(c => c._id === data.chatId);
        if (chatIndex !== -1) {
          updatedChats[chatIndex].updatedAt = new Date();
          // Move the updated chat to the top
          const [updatedChat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(updatedChat);
        }
        return updatedChats;
      });
    });

    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      // Handle error (show notification, etc.)
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user, token, currentChat]);

  // Load user's instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const res = await axios.get('/api/instructions');
        setInstructions(res.data);
        
        // Set default instruction if available
        const defaultInstruction = res.data.find(inst => inst.isDefault);
        if (defaultInstruction) {
          setSelectedInstruction(defaultInstruction._id);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching instructions:', err);
        setLoading(false);
      }
    };

    if (user) {
      fetchInstructions();
    }
  }, [user]);

  // Load user's chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get('/api/chats');
        setChats(res.data);
      } catch (err) {
        console.error('Error fetching chats:', err);
      }
    };

    if (user) {
      fetchChats();
    }
  }, [user]);

  // Load messages when a chat is selected
  useEffect(() => {
    const fetchChat = async () => {
      if (!currentChat) return;
      
      try {
        const res = await axios.get(`/api/chats/${currentChat._id}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      }
    };

    if (currentChat) {
      fetchChat();
    } else {
      setMessages([]);
    }
  }, [currentChat]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    // Get selected instruction content
    let customInstructionsContent = '';
    if (selectedInstruction) {
      const selectedInst = instructions.find(inst => inst._id === selectedInstruction);
      if (selectedInst) {
        customInstructionsContent = selectedInst.content;
      }
    }
    
    // Add user message to chat locally
    const userMessage = {
      sender: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    
    // Send message to server
    socket.emit('sendMessage', {
      chatId: currentChat?._id,
      message: input,
      customInstructions: customInstructionsContent
    });
    
    // Clear input
    setInput('');
  };

  const createNewChat = async () => {
    try {
      const res = await axios.post('/api/chats', {
        instructionId: selectedInstruction || null
      });
      
      setChats((prevChats) => [res.data, ...prevChats]);
      setCurrentChat(res.data);
      setMessages([]);
    } catch (err) {
      console.error('Error creating new chat:', err);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Chat list sidebar */}
      <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto border-r">
        <button 
          onClick={createNewChat}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md mb-4"
        >
          New Chat
        </button>
        
        {chats.map((chat) => (
          <div 
            key={chat._id}
            className={`p-3 mb-2 rounded-md cursor-pointer ${
              currentChat && currentChat._id === chat._id 
                ? 'bg-blue-100' 
                : 'hover:bg-gray-200'
            }`}
            onClick={() => setCurrentChat(chat)}
          >
            <p className="truncate font-medium">
              {chat.messages && chat.messages.length > 0 
                ? chat.messages[0].content.substring(0, 30) + '...'
                : 'New conversation'}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(chat.updatedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="bg-white p-4 border-b">
          <h1 className="text-2xl font-bold">Chat with Gemini</h1>
          
          {/* Instruction selector */}
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Instructions:
            </label>
            <select
              value={selectedInstruction}
              onChange={(e) => setSelectedInstruction(e.target.value)}
              className="w-full p-2 border rounded-md"
              disabled={loading}
            >
              <option value="">Default Instructions</option>
              {instructions.map((instruction) => (
                <option key={instruction._id} value={instruction._id}>
                  {instruction.name} {instruction.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {!currentChat ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-xl mb-2">Select a chat or create a new one</p>
                <button 
                  onClick={createNewChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          ) : (
            messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="text-xl">Start your conversation</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
                >
                  <div 
                    className={`inline-block p-3 rounded-lg max-w-3/4 ${
                      msg.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-black'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!currentChat}
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-r-md"
              disabled={!input.trim() || !currentChat}
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
