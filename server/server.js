const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const jwt = require('jsonwebtoken');

// Import models
const User = require('./models/User');
const Instruction = require('./models/Instruction');
const Chat = require('./models/Chat'); // Add this line

// Import routes
const authRoutes = require('./routes/auth');
const instructionRoutes = require('./routes/instructions');
const chatRoutes = require('./routes/chats');

dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instructions', instructionRoutes);
app.use('/api/chats', chatRoutes);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io middleware for authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: Token not provided'));
  }

  try {
    // Verify token (implement your JWT verification logic here)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);

  socket.on('authenticate', (data) => {
    // Additional authentication logic if needed
    console.log('User authenticated:', data.userId);
  });

  socket.on('sendMessage', async (data) => {
    try {
      const { chatId, message, customInstructions } = data;
      const userId = socket.userId;
      
      // Find or create a chat for this user
      let chat;
      if (chatId) {
        chat = await Chat.findOne({ _id: chatId, user: userId });
        if (!chat) {
          return socket.emit('error', { message: 'Chat not found' });
        }
      } else {
        // Create a new chat if no chatId is provided
        let instructionId = null;
        
        if (customInstructions) {
          const instruction = await Instruction.findOne({ 
            content: customInstructions, 
            user: userId 
          });
          if (instruction) {
            instructionId = instruction._id;
          }
        }
        
        chat = new Chat({
          user: userId,
          instruction: instructionId,
          messages: []
        });
      }
      
      // Add user message to chat
      chat.messages.push({
        sender: 'user',
        content: message,
        timestamp: new Date()
      });
      
      // Update the chat's updatedAt timestamp
      chat.updatedAt = new Date();
      
      // Generate response from Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const systemPrompt = customInstructions || "You are a helpful assistant.";
      
      // Build conversation history from previous messages
      const chatHistory = [];
      
      // Add system prompt as the first message
      chatHistory.push({
        role: "user",
        parts: [{ text: "Please follow these instructions for our conversation: " + systemPrompt }],
      });
      
      chatHistory.push({
        role: "model",
        parts: [{ text: "I'll follow those instructions. How can I help you today?" }],
      });
      
      // Add previous messages from this chat to provide context
      // Skip the last message as it's the one we just added and will send separately
      for (let i = 0; i < chat.messages.length - 1; i++) {
        const msg = chat.messages[i];
        chatHistory.push({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      }
      
      // Start chat with history
      const geminiChat = model.startChat({
        history: chatHistory,
      });
      
      // Send the current message
      const result = await geminiChat.sendMessage(message);
      const aiResponse = result.response.text();
      
      // Add bot message to chat
      chat.messages.push({
        sender: 'bot',
        content: aiResponse,
        timestamp: new Date()
      });
      
      // Save the updated chat
      await chat.save();
      
      // Send response back to client
      socket.emit('message', {
        chatId: chat._id,
        message: {
          sender: 'bot',
          content: aiResponse,
          timestamp: new Date()
        }
      });
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      socket.emit('error', { message: 'Failed to generate response' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
