const express = require('express');
const router = express.Router();
const DeliveryRequest = require('../models/DeliveryRequest');


// CREATE
router.post('/', async (req, res) => {
    try {
        const request = await DeliveryRequest.create(req.body);
        res.status(201).json(request);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/',async(req,res)=>{
    try{
        const requests=await DeliveryRequest.find({});
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// UPDATE (no status allowed here)
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


// ✅ ACCEPT REQUEST
router.put('/:id/accept', async (req, res) => {
    try {
        const { userId } = req.body;

        // 🔴 REQUIRED CHECK
        if (!userId) {
            return res.status(400).json({
                message: "userId is required to accept request"
            });
        }

        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        // 🔒 ONLY OPEN CAN BE ACCEPTED
        if (request.status !== 'OPEN') {
            return res.status(400).json({
                message: "Request already accepted or completed"
            });
        }

        request.status = 'IN_PROGRESS';
        request.acceptedBy = userId;

        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// ✅ COMPLETE REQUEST
router.put('/:id/complete', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required to complete request" });
        }

        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

        if (request.status !== 'IN_PROGRESS') {
            return res.status(400).json({ message: "Request must be in progress to complete" });
        }

        // 🔒 ONLY ASSIGNED USER CAN COMPLETE
        if (request.acceptedBy.toString() !== userId) {
            return res.status(403).json({ message: "Only the user who accepted this request can complete it" });
        }

        request.status = 'COMPLETED';
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
