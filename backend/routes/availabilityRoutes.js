const express = require('express');
const AvailabilityRequest = require('../models/AvailabilityRequest');
const Outlet = require('../models/Outlet');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/availability
 * Create a new availability request (students only)
 */
router.post('/', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const { itemName, outlet } = req.body;

    if (!itemName || !outlet) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Set expiresAt to next midnight
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    expiresAt.setHours(0, 0, 0, 0);

    const availReq = new AvailabilityRequest({
      itemName,
      outlet,
      requestedBy: req.user.userId,
      status: 'PENDING',
      expiresAt
    });

    await availReq.save();
    res.status(201).json({ message: 'Availability request created', request: availReq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/availability
 * Get availability requests
 * Query: filter=own|public (required)
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { filter = 'own' } = req.query;
    let query = {};

    if (filter === 'own') {
      // User's own requests (including responded)
      query = { requestedBy: req.user.userId };
    } else if (filter === 'public') {
      // Public confirmed availabilities (visible to all)
      query = { status: 'CONFIRMED' };
    } else {
      return res.status(400).json({ message: 'Filter must be own or public' });
    }

    const requests = await AvailabilityRequest.find(query)
      .populate('requestedBy', 'name phone')
      .populate('response.respondedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/availability/pending
 * Get pending requests for outlet owner (their outlet only)
 */
router.get('/pending/all', verifyToken, requireRole('outlet_owner'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    const requests = await AvailabilityRequest.find({
      outlet: user?.outletId ? (await Outlet.findById(user.outletId))?.name : null,
      status: 'PENDING'
    })
      .populate('requestedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/availability/:id
 * Get single availability request
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const request = await AvailabilityRequest.findById(req.params.id)
      .populate('requestedBy', 'name email phone')
      .populate('response.respondedBy', 'name email phone');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/availability/:id
 * Edit request (only if PENDING and owned by user)
 */
router.put('/:id', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const request = await AvailabilityRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission check
    if (request.requestedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Can only edit your own requests' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Can only edit pending requests' });
    }

    const { itemName, outlet } = req.body;
    if (itemName) request.itemName = itemName;
    if (outlet) request.outlet = outlet;

    await request.save();
    res.json({ message: 'Request updated', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/availability/:id
 * Delete request (only if PENDING and owned by user)
 */
router.delete('/:id', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const request = await AvailabilityRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission check
    if (request.requestedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Can only delete your own requests' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Can only delete pending requests' });
    }

    await AvailabilityRequest.deleteOne({ _id: req.params.id });
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/availability/:id/respond
 * Respond to availability request (outlet owner only)
 */
router.put('/:id/respond', verifyToken, requireRole('outlet_owner'), async (req, res) => {
  try {
    const { available } = req.body;

    if (typeof available !== 'boolean') {
      return res.status(400).json({ message: 'Available must be true or false' });
    }

    const request = await AvailabilityRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Set response
    request.status = 'CONFIRMED';
    request.response = {
      available,
      respondedBy: req.user.userId,
      respondedAt: new Date()
    };

    await request.save();
    res.json({ message: 'Response recorded', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;


// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const request = await AvailabilityRequest.findByIdAndDelete(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json({ message: "Request deleted successfully" });
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
