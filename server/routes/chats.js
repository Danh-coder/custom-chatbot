const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all chats for the current user
router.get('/', async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.user.userId })
      .sort({ updatedAt: -1 })
      .select('-messages'); // Exclude messages to reduce payload size
    
    res.json(chats);
  } catch (err) {
    console.error('Get chats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific chat with all messages
router.get('/:chatId', async (req, res) => {
  try {
    const chat = await Chat.findOne({ 
      _id: req.params.chatId, 
      user: req.user.userId 
    });
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json(chat);
  } catch (err) {
    console.error('Get chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat
router.post('/', async (req, res) => {
  try {
    const { instructionId, initialMessage } = req.body;
    
    const newChat = new Chat({
      user: req.user.userId,
      instruction: instructionId || null,
      messages: initialMessage ? [{
        sender: 'user',
        content: initialMessage,
        timestamp: new Date()
      }] : []
    });
    
    await newChat.save();
    res.status(201).json(newChat);
  } catch (err) {
    console.error('Create chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a chat
router.delete('/:chatId', async (req, res) => {
  try {
    const result = await Chat.deleteOne({ 
      _id: req.params.chatId,
      user: req.user.userId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Delete chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
