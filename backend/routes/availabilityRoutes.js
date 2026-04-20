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

    // Verify outlet exists
    const outletDoc = await Outlet.findById(outlet);
    if (!outletDoc) {
      return res.status(404).json({ message: 'Outlet not found' });
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
    await availReq.populate('outlet', 'name locationDescription');
    res.status(201).json({ message: 'Availability request created', request: availReq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/availability
 * Get availability requests
 * Query: filter=own|public|all (required)
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
    } else if (filter === 'all') {
      // All pending and confirmed availabilities (for availability tab)
      query = { status: { $in: ['PENDING', 'CONFIRMED'] } };
    } else {
      return res.status(400).json({ message: 'Filter must be own, public, or all' });
    }

    const requests = await AvailabilityRequest.find(query)
      .populate('requestedBy', 'name phone')
      .populate('outlet', 'name locationDescription')
      .populate('response.respondedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/availability/pending/all
 * Get pending AND confirmed requests for outlet owner (their outlet only)
 * Used by outlet owners to view their requests (pending to respond to, confirmed as history)
 */
router.get('/pending/all', verifyToken, requireRole('outlet_owner'), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('outletId');

    if (!user?.outletId) {
      return res.json({ requests: [] });
    }

    const now = new Date();
    const requests = await AvailabilityRequest.find({
      outlet: user.outletId?._id,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      expiresAt: { $gt: now } // Only return non-expired requests
    })
      .populate('requestedBy', 'name phone')
      .populate('outlet', 'name locationDescription')
      .populate('response.respondedBy', 'name phone')
      .sort({ status: 1, createdAt: -1 }); // PENDING first, then CONFIRMED

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
      .populate('outlet', 'name locationDescription')
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
    if (outlet) {
      // Verify outlet exists
      const outletDoc = await Outlet.findById(outlet);
      if (!outletDoc) {
        return res.status(404).json({ message: 'Outlet not found' });
      }
      request.outlet = outlet;
    }

    await request.save();
    await request.populate('outlet', 'name locationDescription');
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

    const request = await AvailabilityRequest.findById(req.params.id)
      .populate('outlet');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify this request is for the outlet owner's outlet
    const user = await User.findById(req.user.userId);
    if (!user.outletId || user.outletId.toString() !== request.outlet._id.toString()) {
      return res.status(403).json({ message: 'Can only respond to requests for your outlet' });
    }

    // Set response
    request.status = 'CONFIRMED';
    request.response = {
      available,
      respondedBy: req.user.userId,
      respondedAt: new Date()
    };

    await request.save();
    await request.populate('outlet', 'name locationDescription');
    res.json({ message: 'Response recorded', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
