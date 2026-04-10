const express = require('express');
const Outlet = require('../models/Outlet');
const AvailabilityRequest = require('../models/AvailabilityRequest');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/outlets
 * Get all outlets
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const outlets = await Outlet.find();

    // Add stats
    const outletsWithStats = await Promise.all(
      outlets.map(async (outlet) => {
        const requestsCount = await AvailabilityRequest.countDocuments({
          outlet: outlet.name
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
 * Get single outlet
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const outlet = await Outlet.findById(req.params.id);

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    const requestsCount = await AvailabilityRequest.countDocuments({
      outlet: outlet.name
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
 */
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { name, locationDescription } = req.body;

    if (!name || !locationDescription) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const outlet = new Outlet({
      name,
      locationDescription,
      isActive: true
    });

    await outlet.save();
    res.status(201).json({ message: 'Outlet created', outlet });
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
    const outlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
    const outlet = await Outlet.findByIdAndDelete(req.params.id);

    if (!outlet) {
      return res.status(404).json({ message: 'Outlet not found' });
    }

    res.json({ message: 'Outlet deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

