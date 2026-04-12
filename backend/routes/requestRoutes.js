const express = require('express');
const DeliveryRequest = require('../models/DeliveryRequest');
const Outlet = require('../models/Outlet');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/requests
 * Create a new delivery request (students only)
 */
router.post('/', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const { itemDescription, outlet, hostel, fee } = req.body;

    if (!itemDescription || !outlet || !hostel || !fee) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Handle outlet: convert name to ObjectId if needed
    let outletId = outlet;
    if (!outlet.match(/^[0-9a-fA-F]{24}$/)) {
      // It's not an ObjectId, so try to find outlet by name
      const outletDoc = await Outlet.findOne({ name: outlet });
      if (!outletDoc) {
        return res.status(400).json({ message: `Outlet "${outlet}" not found` });
      }
      outletId = outletDoc._id;
    }

    const deliveryReq = new DeliveryRequest({
      itemDescription,
      outlet: outletId,
      hostel,
      fee,
      status: 'OPEN',
      requestedBy: req.user.userId,
      requesterRating: { rating: null, feedback: null, givenAt: null },
      delivererRating: { rating: null, feedback: null, givenAt: null }
    });

    await deliveryReq.save();
    res.status(201).json({ message: 'Request created', request: deliveryReq });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/requests
 * Get delivery requests with filters
 * Query: filter=all|own|inprogress|completed
 *        outlet=name, minFee=X, maxFee=Y, sortBy=date|rating
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const { filter = 'all', outlet, minFee, maxFee, sortBy = 'date' } = req.query;
    let query = {};
    let sort = { createdAt: -1 };

    if (sortBy === 'rating') {
      sort = { 'requesterRating.rating': -1 };
    }

    if (filter === 'all') {
      // Public board: all OPEN requests except own
      query = {
        status: 'OPEN',
        requestedBy: { $ne: req.user.userId }
      };

      // Apply filters - search by outlet name
      if (outlet) {
        const outletDoc = await Outlet.findOne({ name: new RegExp(outlet, 'i') });
        if (outletDoc) {
          query.outlet = outletDoc._id;
        } else {
          // No matching outlet, return empty array
          return res.json({ requests: [] });
        }
      }
      if (minFee || maxFee) {
        query.fee = {};
        if (minFee) query.fee.$gte = Number(minFee);
        if (maxFee) query.fee.$lte = Number(maxFee);
      }
    } else if (filter === 'own') {
      // User's own requests
      query = { requestedBy: req.user.userId };
    } else if (filter === 'inprogress') {
      // In-progress requests where user is involved
      query = {
        status: 'IN_PROGRESS',
        $or: [
          { requestedBy: req.user.userId },
          { acceptedBy: req.user.userId }
        ]
      };
    } else if (filter === 'completed') {
      // User's completed requests
      query = {
        status: 'COMPLETED',
        requestedBy: req.user.userId
      };
    }

    const requests = await DeliveryRequest.find(query)
      .populate('requestedBy', 'name phone requesterRating delivererRating')
      .populate('acceptedBy', 'name phone requesterRating delivererRating')
      .populate('outlet', 'name locationDescription')
      .sort(sort);

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/requests/:id
 * Get single request details
 */
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id)
      .populate('requestedBy', 'name email phone requesterRating delivererRating')
      .populate('acceptedBy', 'name email phone requesterRating delivererRating')
      .populate('outlet', 'name locationDescription');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission: only requester, deliverer, or admin can view
    if (request.requestedBy._id.toString() !== req.user.userId &&
        request.acceptedBy?._id.toString() !== req.user.userId &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/requests/:id
 * Edit request (only if PENDING and owned by user)
 */
router.put('/:id', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission check
    if (request.requestedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Can only edit your own requests' });
    }

    if (request.status !== 'OPEN') {
      return res.status(400).json({ message: 'Can only edit pending requests' });
    }

    const { itemDescription, outlet, hostel, fee } = req.body;
    if (itemDescription) request.itemDescription = itemDescription;
    if (outlet) request.outlet = outlet;
    if (hostel) request.hostel = hostel;
    if (fee) request.fee = fee;

    await request.save();
    res.json({ message: 'Request updated', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * DELETE /api/requests/:id
 * Delete request (only if PENDING and owned by user)
 */
router.delete('/:id', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission check
    if (request.requestedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Can only delete your own requests' });
    }

    if (request.status !== 'OPEN') {
      return res.status(400).json({ message: 'Can only delete pending requests' });
    }

    await DeliveryRequest.deleteOne({ _id: req.params.id });
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/requests/:id/accept
 * Accept a delivery request (mark as IN_PROGRESS)
 */
router.put('/:id/accept', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission checks
    if (request.status !== 'OPEN') {
      return res.status(400).json({ message: 'Only open requests can be accepted' });
    }

    if (request.requestedBy.toString() === req.user.userId) {
      return res.status(400).json({ message: 'Cannot accept your own request' });
    }

    // Accept request
    request.status = 'IN_PROGRESS';
    request.acceptedBy = req.user.userId;
    await request.save();

    res.json({ message: 'Request accepted', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/requests/:id/complete
 * Mark request as completed (deliverer only)
 */
router.put('/:id/complete', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const request = await DeliveryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Permission: only deliverer (acceptedBy) can complete
    if (request.acceptedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Only deliverer can complete request' });
    }

    if (request.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Only in-progress requests can be completed' });
    }

    request.status = 'COMPLETED';
    request.completedAt = new Date();
    await request.save();

    res.json({ message: 'Request completed. Please rate both parties.', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * PUT /api/requests/:id/rate
 * Rate the other party in a completed delivery
 */
router.put('/:id/rate', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1-5' });
    }

    const request = await DeliveryRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'Only completed requests can be rated' });
    }

    // Determine if rater is requester or deliverer
    const isRequester = request.requestedBy.toString() === req.user.userId;
    const isDeliverer = request.acceptedBy.toString() === req.user.userId;

    if (!isRequester && !isDeliverer) {
      return res.status(403).json({ message: 'You are not part of this transaction' });
    }

    // Store rating
    if (isRequester) {
      request.requesterRating = {
        rating: Number(rating),
        feedback: feedback || null,
        givenAt: new Date()
      };
    } else {
      request.delivererRating = {
        rating: Number(rating),
        feedback: feedback || null,
        givenAt: new Date()
      };
    }

    await request.save();

    // Update user's average rating
    await updateUserRatings(isRequester ? request.acceptedBy : request.requestedBy, isRequester ? 'delivererRating' : 'requesterRating');

    res.json({ message: 'Rating submitted', request });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Helper: Update user's average rating
 */
async function updateUserRatings(userId, ratingType) {
  try {
    const completedRequests = await DeliveryRequest.find({
      status: 'COMPLETED'
    });

    let relevantRequests = [];

    if (ratingType === 'requesterRating') {
      relevantRequests = completedRequests.filter(r =>
        r.requestedBy.toString() === userId.toString() && r.requesterRating.rating
      );
    } else {
      relevantRequests = completedRequests.filter(r =>
        r.acceptedBy.toString() === userId.toString() && r.delivererRating.rating
      );
    }

    let average = 0;
    if (relevantRequests.length > 0) {
      const sum = relevantRequests.reduce((acc, req) => {
        const rating = ratingType === 'requesterRating' ? req.requesterRating.rating : req.delivererRating.rating;
        return acc + (rating || 0);
      }, 0);
      average = sum / relevantRequests.length;
    }

    // Update user
    const field = ratingType === 'requesterRating' ? 'requesterRating' : 'delivererRating';
    await User.updateOne({ _id: userId }, { [field]: average });
  } catch (error) {
    console.error('Error updating user ratings:', error);
  }
}

module.exports = router;
