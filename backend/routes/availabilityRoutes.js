const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');

// Create availability
router.post('/', async (req, res) => {
  try {
    const availability = await Availability.create(req.body);
    res.status(201).json(availability);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all availability queries
router.get('/', async (req, res) => {
  try {
    const availabilities = await Availability.find().sort({ createdAt: -1 });
    res.json(availabilities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Respond to an availability query
router.put('/:id/respond', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['AVAILABLE', 'NOT_AVAILABLE'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const item = await Availability.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });

    // Enforce that outlets can only respond once
    if (item.status !== 'PENDING') {
      return res.status(400).json({ message: "Already responded to." });
    }

    item.status = status;
    await item.save();
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
