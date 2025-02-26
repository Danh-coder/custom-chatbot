const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Instruction = require('./models/Instruction');
const Chat = require('./models/Chat');

dotenv.config();

const initializeDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await Instruction.collection.createIndex({ user: 1, name: 1 }, { unique: true });
    await Chat.collection.createIndex({ user: 1, updatedAt: -1 });

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initializeDatabase();
