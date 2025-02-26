const Instruction = require('../models/Instruction');

// Get all instructions for a user
exports.getUserInstructions = async (req, res) => {
  try {
    const instructions = await Instruction.find({ user: req.user.id });
    res.status(200).json(instructions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new instruction
exports.createInstruction = async (req, res) => {
  try {
    const { name, content, isDefault } = req.body;
    
    // If this is set as default, unset any existing default
    if (isDefault) {
      await Instruction.updateMany(
        { user: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const instruction = new Instruction({
      user: req.user.id,
      name,
      content,
      isDefault: isDefault || false
    });
    
    await instruction.save();
    res.status(201).json(instruction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update an instruction
exports.updateInstruction = async (req, res) => {
  try {
    const { name, content, isDefault } = req.body;
    
    // If this is set as default, unset any existing default
    if (isDefault) {
      await Instruction.updateMany(
        { user: req.user.id, isDefault: true },
        { $set: { isDefault: false } }
      );
    }
    
    const instruction = await Instruction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        name, 
        content, 
        isDefault: isDefault || false,
        updatedAt: Date.now()
      },
      { new: true }
    );
    
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    
    res.status(200).json(instruction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an instruction
exports.deleteInstruction = async (req, res) => {
  try {
    const instruction = await Instruction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });
    
    if (!instruction) {
      return res.status(404).json({ message: 'Instruction not found' });
    }
    
    res.status(200).json({ message: 'Instruction deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get default instruction
exports.getDefaultInstruction = async (req, res) => {
  try {
    const instruction = await Instruction.findOne({
      user: req.user.id,
      isDefault: true
    });
    
    if (!instruction) {
      return res.status(404).json({ message: 'No default instruction found' });
    }
    
    res.status(200).json(instruction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
