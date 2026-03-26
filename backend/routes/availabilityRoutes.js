const express = require('express');
const router = express.Router();
<<<<<<< HEAD
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
=======
const AvailabilityRequest = require('../models/AvailabilityRequest');


// CREATE
router.post('/', async (req, res) => {
    try {
        const request = await AvailabilityRequest.create(req.body);
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// GET ALL
router.get('/', async (req, res) => {
    try {
        const { status, outlet } = req.query;

        let filter = {};
        if (status) filter.status = status;
        if (outlet) filter.outlet = outlet;

        const requests = await AvailabilityRequest
            .find(filter)
            .populate('requestedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// RESPOND
router.put('/:id/respond', async (req, res) => {
    try {
        const { status } = req.body;

        if (!['AVAILABLE', 'NOT_AVAILABLE'].includes(status)) {
            return res.status(400).json({
                message: "Status must be AVAILABLE or NOT_AVAILABLE"
            });
        }

        const request = await AvailabilityRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'PENDING') {
            return res.status(400).json({
                message: "Request already responded to"
            });
        }

        request.status = status;

        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// CLEANUP
router.delete('/cleanup/all', async (req, res) => {
    try {
        const result = await AvailabilityRequest.deleteMany({});
        res.json({
            message: "All availability requests deleted",
            deleted: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
>>>>>>> feature/backend-sprint2
