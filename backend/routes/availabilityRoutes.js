const express = require('express');
const router = express.Router();
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


// UPDATE (Edit item/outlet)
router.put('/:id', async (req, res) => {
    try {
        const { item, outlet } = req.body;

        const request = await AvailabilityRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // Only allow editing if status is PENDING
        if (request.status !== 'PENDING') {
            return res.status(400).json({
                message: "Can only edit pending requests"
            });
        }

        if (item) request.item = item;
        if (outlet) request.outlet = outlet;

        await request.save();

        res.json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


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
