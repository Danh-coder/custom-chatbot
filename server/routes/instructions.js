const express = require('express');
const router = express.Router();
const Instruction = require('../models/Instruction');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all instructions for the current user
router.get('/', async (req, res) => {
  try {
    const instructions = await Instruction.find({ user: req.user.userId });
    res.json(instructions);
  } catch (err) {
    console.error('Get instructions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific instruction
router.get('/:id', async (req, res) => {
  try {
    const instruction = await Instruction.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    
    res.json(instruction);
  } catch (err) {
    console.error('Get instruction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new instruction
router.post('/', async (req, res) => {
  try {
    const { name, content, isDefault } = req.body;
    
    // If setting as default, unset any existing default
    if (isDefault) {
      await Instruction.updateMany(
        { user: req.user.userId },
        { isDefault: false }
      );
    }
    
    const instruction = new Instruction({
      user: req.user.userId,
      name,
      content,
      isDefault
    });
    
    await instruction.save();
    res.status(201).json(instruction);
  } catch (err) {
    console.error('Create instruction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an instruction
router.put('/:id', async (req, res) => {
  try {
    const { name, content, isDefault } = req.body;
    
    // Find instruction and check ownership
    let instruction = await Instruction.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    
    // If setting as default, unset any existing default
    if (isDefault && !instruction.isDefault) {
      await Instruction.updateMany(
        { user: req.user.userId, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }
    
    // Update fields
    instruction.name = name;
    instruction.content = content;
    instruction.isDefault = isDefault;
    
    await instruction.save();
    res.json(instruction);
  } catch (err) {
    console.error('Update instruction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete an instruction
router.delete('/:id', async (req, res) => {
  try {
    const result = await Instruction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    
    res.json({ message: 'Instruction deleted' });
  } catch (err) {
    console.error('Delete instruction error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
