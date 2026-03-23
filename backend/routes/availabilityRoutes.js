const express = require('express');
const router = express.Router();
const AvailabilityRequest = require('../models/AvailabilityRequest');


// ==============================
// CREATE (Student asks availability)
// ==============================
router.post('/', async (req, res) => {
    try {
        const request = await AvailabilityRequest.create(req.body);
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// ==============================
// GET ALL (with optional filters)
// ==============================
router.get('/', async (req, res) => {
    try {
        const { status, outlet } = req.query;

        let filter = {};

        if (status) filter.status = status;
        if (outlet) filter.outlet = outlet;

        const requests = await AvailabilityRequest
            .find(filter)
            .populate('requestedBy', 'name');

        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ==============================
// RESPOND (Outlet owner)
// ==============================
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

        // Only allow response if still pending
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