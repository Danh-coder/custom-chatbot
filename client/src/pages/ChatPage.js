import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [pendingNewChat, setPendingNewChat] = useState(false); // New state to track pending new chat
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const [instructions, setInstructions] = useState([]);
  const [selectedInstruction, setSelectedInstruction] = useState("");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);
  // Add a ref to track the current chat ID
  const currentChatIdRef = useRef(null);
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Update the ref whenever currentChat changes
  useEffect(() => {
    currentChatIdRef.current = currentChat?._id || null;
  }, [currentChat]);

  // Initialize socket connection - FIXED: removed currentChat dependency
  useEffect(() => {
    if (!user || !token) return;

    const socketInstance = io(
      process.env.REACT_APP_API_URL || "http://localhost:5000",
      {
        auth: {
          token,
        },
      }
    );

    socketInstance.on("connect", () => {
      console.log("Connected to socket server");
      socketInstance.emit("authenticate", { userId: user.id });
    });

    socketInstance.on("message", (data) => {
      console.log("message socket on");

      // Use the ref instead of the closed-over currentChat value
      if (currentChatIdRef.current && data.chatId === currentChatIdRef.current) {
        console.log("Current chat ID matches incoming message chat ID");
        setMessages((prevMessages) => [...prevMessages, data.message]);
      }

      // Update the chat list to show this chat is updated
      setChats((prevChats) => {
        const updatedChats = [...prevChats];
        const chatIndex = updatedChats.findIndex((c) => c._id === data.chatId);
        if (chatIndex !== -1) {
          updatedChats[chatIndex].updatedAt = new Date();
          // Move the updated chat to the top
          const [updatedChat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(updatedChat);
        }
        return updatedChats;
      });
    });

    socketInstance.on("error", (error) => {
      console.error("Socket error:", error);
      // Handle error (show notification, etc.)
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]); // FIXED: Removed currentChat dependency

  // Load user's instructions
  useEffect(() => {
    const fetchInstructions = async () => {
      try {
        const res = await axios.get("/api/instructions");
        setInstructions(res.data);

        // Set default instruction if available
        const defaultInstruction = res.data.find((inst) => inst.isDefault);
        if (defaultInstruction) {
          setSelectedInstruction(defaultInstruction._id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching instructions:", err);
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
        const res = await axios.get("/api/chats");
        setChats(res.data);
      } catch (err) {
        console.error("Error fetching chats:", err);
      }
    };

    if (user) {
      fetchChats();
    }
  }, [user]);

  // Load messages when a chat is selected
  // Modified useEffect for fetching chat messages
  useEffect(() => {
    const fetchChat = async () => {
      if (!currentChat) return;

      // Skip fetching if this is a newly created chat (we already have its initial state)
      if (currentChat.isNewlyCreated) {
        delete currentChat.isNewlyCreated; // Clean up the flag after use
        return;
      }

      try {
        const res = await axios.get(`/api/chats/${currentChat._id}`);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Error fetching chat messages:", err);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Modified to just set pending state rather than creating a chat
  const prepareNewChat = () => {
    setPendingNewChat(true);
    setCurrentChat(null);
    setMessages([]);
    setSidebarOpen(false);
    // Focus the input field
    document.querySelector('input[type="text"]')?.focus();
  };

  // Create a new chat and return its ID
  const createNewChat = async () => {
    try {
      const res = await axios.post("/api/chats", {
        instructionId: selectedInstruction || null,
      });
      
      // Add a flag to indicate this is a newly created chat
      const newChat = { ...res.data, isNewlyCreated: true };
      
      setChats((prevChats) => [newChat, ...prevChats]);
      setCurrentChat(newChat);
      setPendingNewChat(false); // Reset pending state
      
      return newChat; // Return the newly created chat
    } catch (err) {
      console.error("Error creating new chat:", err);
      return null;
    }
  };

  // Handle message submission - now with proper async handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;

    let chatToUse = currentChat;

    // If no chat is selected but we're in pending new chat mode, create a new one first
    if (!chatToUse && (pendingNewChat || !currentChat)) {
      chatToUse = await createNewChat();
      if (!chatToUse) {
        // Handle error creating chat
        return;
      }
    }

    // Get selected instruction content
    let customInstructionsContent = "";
    if (selectedInstruction) {
      const selectedInst = instructions.find(
        (inst) => inst._id === selectedInstruction
      );
      if (selectedInst) {
        customInstructionsContent = selectedInst.content;
      }
    }

    // Add user message to chat locally
    const userMessage = {
      sender: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => {
      // console.log("setMessages func");
      // console.log(currentChat);
      // console.log(prevMessages);

      return [...prevMessages, userMessage];
    });

    // Send message to server
    // console.log("chatToUse", chatToUse);
    // console.log("currentChat", currentChat);

    socket.emit("sendMessage", {
      chatId: chatToUse._id,
      message: input,
      customInstructions: customInstructionsContent,
    });

    // Clear input
    setInput("");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navigateToInstructions = () => {
    navigate("/instructions");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle clicking outside sidebar to close it (on mobile)
  const handleOverlayClick = (e) => {
    if (sidebarOpen && e.target.classList.contains("sidebar-overlay")) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Overlay for mobile sidebar (when open) */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay fixed inset-0 bg-black bg-opacity-30 z-20 md:hidden"
          onClick={handleOverlayClick}
        ></div>
      )}

      {/* Chat list sidebar - now with reorganized elements */}
      <div
        className={`
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0
        fixed md:relative
        top-0 md:top-auto
        left-0 md:left-auto
        h-full md:h-auto
        w-3/4 md:w-1/4
        max-w-xs md:max-w-none
        bg-white md:bg-gray-100
        border-r
        overflow-y-auto
        z-30 md:z-0
        transition-transform duration-300 ease-in-out
        flex flex-col
        shadow-lg md:shadow-none
      `}
      >
        {/* App name at the top */}
        <div className="p-4 border-b bg-white-500 text-blue-600">
          <h1 className="text-xl font-bold text-center">
            <Link to="/">MessPal</Link>
          </h1>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-b">
          <button
            onClick={prepareNewChat}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md mb-3 transition duration-200 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Chat
          </button>

          <button
            onClick={navigateToInstructions}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-md transition duration-200 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
            Manage Instructions
          </button>
        </div>

        {/* Chat list - flex-grow to take available space */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Instruction selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Active Instructions:
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
                  {instruction.name} {instruction.isDefault ? "(Default)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Chat list */}
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              <p>No chats yet.</p>
              <p className="mt-1">
                Type a message below to start a new conversation!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  className={`p-3 rounded-md cursor-pointer transition duration-200 ${
                    currentChat && currentChat._id === chat._id
                      ? "bg-blue-100 border-l-4 border-blue-500"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => {
                    setCurrentChat(chat);
                    setPendingNewChat(false); // Reset pending state when selecting a chat
                    setSidebarOpen(false); // Close sidebar after selecting chat on mobile
                  }}
                >
                  <p className="truncate font-medium">
                    {chat.messages && chat.messages.length > 0
                      ? chat.messages[0].content.substring(0, 30) + "..."
                      : "New conversation"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.updatedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User info and logout at the bottom */}
        <div className="p-4 border-t mt-auto bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="ml-2 font-medium truncate">
                {user?.username || "User"}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 transition duration-200"
              title="Logout"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat header with selected instruction */}
        <div className="bg-white p-4 border-b flex items-center justify-between">
          <div>
            <Link
              to="/"
              className="text-xl font-bold text-blue-600 flex-shrink-0"
            >
              MessPal
            </Link>
            {selectedInstruction && (
              <p className="text-sm text-gray-600">
                Using instruction:{" "}
                {instructions.find((inst) => inst._id === selectedInstruction)
                  ?.name || "Custom Instructions"}
              </p>
            )}
          </div>

          {/* Mobile toggle button */}
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Messages area - updated to show welcome messages and guide users */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {pendingNewChat ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-blue-50 rounded-full p-6 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">
                Ready for a New Conversation
              </h2>
              <p className="text-gray-600 max-w-md">
                Type your first message below to start a new chat.
              </p>
            </div>
          ) : !currentChat && chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-blue-50 rounded-full p-6 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">Welcome to MessPal!</h2>
              <p className="text-gray-600 max-w-md">
                Type your message below to start a conversation or select a chat from
                the sidebar.
              </p>
            </div>
          ) : !currentChat && chats.length > 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="bg-blue-50 rounded-full p-6 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-medium mb-2">
                Select a conversation
              </h2>
              <p className="text-gray-600 max-w-md">
                Select a chat from the sidebar or type your message below to start a
                new conversation.
              </p>
            </div>
          ) : (
            // : (
            //   currentChat && messages.length === 0 ? (
            //     <div className="flex flex-col items-center justify-center h-full text-center">
            //       <div className="bg-blue-50 rounded-full p-6 mb-4">
            //         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            //         </svg>
            //       </div>
            //       <h2 className="text-xl font-medium mb-2">New Conversation</h2>
            //       <p className="text-gray-600 max-w-md">
            //         Type your first message below to start chatting.
            //       </p>
            //     </div>
            //   )
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`${
                    msg.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-3 rounded-lg max-w-[85%] md:max-w-[75%] ${
                      msg.sender === "user"
                        ? "bg-blue-500 text-white rounded-tr-none"
                        : "bg-gray-200 text-black rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p className="text-xs mt-1 opacity-70 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area - now with proper form handling */}
        <div className="border-t p-3 md:p-4">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                pendingNewChat
                  ? "Type to start a new conversation..."
                  : "Type your message..."
              }
              className="flex-1 p-2 md:p-3 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className={`p-2 md:p-3 rounded-r-md transition duration-200 flex items-center justify-center ${
                input.trim() && socket
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              disabled={!input.trim() || !socket}
            >
              <span className="hidden md:inline mr-1">Send</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
