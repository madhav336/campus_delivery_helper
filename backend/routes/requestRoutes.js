const express = require('express');
const router = express.Router();
const DeliveryRequest = require('../models/DeliveryRequest');
const User = require('../models/User');


// CREATE
router.post('/', async (req, res) => {
    try {
        const request = await DeliveryRequest.create(req.body);
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// GET with filters
router.get('/', async (req, res) => {
    try {
        const { status, acceptedBy } = req.query;

        let filter = {};

        if (status) {
            filter.status = status;
        }

        if (acceptedBy) {
            filter.acceptedBy = acceptedBy;
        }

        const requests = await DeliveryRequest.find(filter);

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// UPDATE (no status or acceptedBy allowed here)
router.put('/:id', async (req, res) => {
    try {
        if (req.body.status || req.body.acceptedBy) {
            return res.status(400).json({
                message: "Use dedicated endpoints to change status"
            });
        }

        const updatedRequest = await DeliveryRequest.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json(updatedRequest);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// DELETE
router.delete('/:id', async (req, res) => {
    try {
        const deletedRequest = await DeliveryRequest.findByIdAndDelete(req.params.id);

        if (!deletedRequest) {
            return res.status(404).json({ message: "Request not found" });
        }

        res.json({ message: "Request deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// CONFIRM REQUEST (Outlet owner confirms → becomes OPEN)
router.put('/:id/confirm', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        // Role check
        const user = await User.findById(userId);
        if (!user || user.role !== 'OUTLET_OWNER') {
            return res.status(403).json({ message: "Only outlet owners can confirm requests" });
        }

        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'PENDING_CONFIRMATION') {
            return res.status(400).json({ message: "Request is not pending confirmation" });
        }

        request.status = 'OPEN';
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// REJECT REQUEST (Outlet owner rejects → becomes CANCELLED)
router.put('/:id/reject', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        // Role check
        const user = await User.findById(userId);
        if (!user || user.role !== 'OUTLET_OWNER') {
            return res.status(403).json({ message: "Only outlet owners can reject requests" });
        }

        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'PENDING_CONFIRMATION') {
            return res.status(400).json({ message: "Request is not pending confirmation" });
        }

        request.status = 'CANCELLED';
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ACCEPT REQUEST (Deliverer accepts → becomes IN_PROGRESS)
router.put('/:id/accept', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required to accept request" });
        }

        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Specific message for unconfirmed requests
        if (request.status === 'PENDING_CONFIRMATION') {
            return res.status(400).json({ message: "Request not yet confirmed by outlet" });
        }

        if (request.status === 'CANCELLED') {
            return res.status(400).json({ message: "Request has been cancelled" });
        }

        if (request.status !== 'OPEN') {
            return res.status(400).json({ message: "Request already accepted or completed" });
        }

        request.status = 'IN_PROGRESS';
        request.acceptedBy = userId;

        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// COMPLETE REQUEST (Deliverer completes → becomes COMPLETED)
router.put('/:id/complete', async (req, res) => {
    try {
        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'IN_PROGRESS') {
            return res.status(400).json({ message: "Request must be in progress to complete" });
        }

        request.status = 'COMPLETED';

        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// CLEANUP
router.delete('/cleanup/all', async (req, res) => {
    try {
        const result = await DeliveryRequest.deleteMany({});
        res.json({
            message: "All requests deleted",
            deleted: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;