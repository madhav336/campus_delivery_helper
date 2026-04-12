const express = require('express');
const Outlet = require('../models/Outlet');
const AvailabilityRequest = require('../models/AvailabilityRequest');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/outlets
 * Get all outlets with stats
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const outlets = await Outlet.find().populate('owner', 'name email phone');

    // Add stats
    const outletsWithStats = await Promise.all(
      outlets.map(async (outlet) => {
        const requestsCount = await AvailabilityRequest.countDocuments({
          outlet: outlet._id
        });
        return {
          ...outlet.toObject(),
          requestsCount
        };
      })
    );

    res.json({ outlets: outletsWithStats });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/outlets/:id
 * Get single outlet with stats
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id).populate('owner', 'name email phone');

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    const requestsCount = await AvailabilityRequest.countDocuments({
      outlet: outlet._id
    });

    res.json({
      outlet: {
        ...outlet.toObject(),
        requestsCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * POST /api/outlets
 * Create outlet (admin only)
 * Body: { name, locationDescription, ownerId }
 */
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, locationDescription, ownerId } = req.body;

    if (!name || !locationDescription || !ownerId) {
      return res.status(400).json({ message: 'Missing required fields: name, locationDescription, ownerId' });
    }

    // Verify owner exists and is outlet_owner
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'outlet_owner') {
      return res.status(400).json({ message: 'Invalid owner or owner is not an outlet owner' });
    }

    const outlet = new Outlet({
      name,
      locationDescription,
      owner: ownerId,
      isActive: true
    });

    await outlet.save();
    await outlet.populate('owner', 'name email phone');

    // Update user's outletId
    owner.outletId = outlet._id;
    await owner.save();

    res.status(201).json({ message: 'Outlet created and linked to owner', outlet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/outlets/:id
 * Update outlet (admin only)
 */
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, locationDescription, ownerId } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (locationDescription) updateData.locationDescription = locationDescription;
    if (ownerId) {
      const owner = await User.findById(ownerId);
      if (!owner || owner.role !== 'outlet_owner') {
        return res.status(400).json({ message: 'Invalid owner or owner is not an outlet owner' });
      }
      updateData.owner = ownerId;
    }

    const outlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone');

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    res.json({ message: 'Outlet updated', outlet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/outlets/:id
 * Delete outlet (admin only)
 */
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    // Clear the owner's outletId reference
    if (outlet.owner) {
      await User.updateOne({ _id: outlet.owner }, { $set: { outletId: null } });
    }

    await Outlet.findByIdAndDelete(req.params.id);

    res.json({ message: 'Outlet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

