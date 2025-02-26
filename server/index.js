const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const instructionRoutes = require('./routes/instructions');
const chatRoutes = require('./routes/chat');
const { authenticateToken } = require('./middleware/auth');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot-app')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instructions', authenticateToken, instructionRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);

// Socket.io connection handler
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // User authentication via socket
  socket.on('authenticate', ({ userId }) => {
    connectedUsers.set(socket.id, userId);
    socket.join(userId); // Join a room with the user's ID
    console.log(`User ${userId} authenticated on socket ${socket.id}`);
  });
  
  // Handle chat messages
  socket.on('sendMessage', async ({ message, customInstructions }) => {
    const userId = connectedUsers.get(socket.id);
    if (!userId) return;
    
    try {
      // In a real app, you'd call your AI service here with the customInstructions
      const botResponse = `Response to: "${message}" (with custom instructions applied)`;
      
      // Save message to database (implement this in a real app)
      // await saveMessageToDatabase(userId, message, botResponse);
      
      // Send response back to the user
      io.to(userId).emit('message', { 
        from: 'bot', 
        text: botResponse, 
        timestamp: new Date() 
      });
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    const userId = connectedUsers.get(socket.id);
    if (userId) {
      console.log(`User ${userId} disconnected`);
      connectedUsers.delete(socket.id);
    }
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
