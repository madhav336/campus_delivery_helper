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
<<<<<<< HEAD
router.get('/',async(req,res)=>{
    try{
        const requests=await DeliveryRequest.find({});
=======


// GET ALL (with population)
router.get('/', async (req, res) => {
    try {
        const requests = await DeliveryRequest.find({})
            .populate('requestedBy', 'name')
            .populate('acceptedBy', 'name');

>>>>>>> feature/backend-sprint2
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// UPDATE (no status/acceptedBy here)
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


<<<<<<< HEAD
// ✅ ACCEPT REQUEST
=======
// ACCEPT REQUEST
>>>>>>> feature/backend-sprint2
router.put('/:id/accept', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const request = await DeliveryRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Request not found" });
        }

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


// COMPLETE REQUEST
router.put('/:id/complete', async (req, res) => {
    try {
        const { userId } = req.body;

<<<<<<< HEAD
        if (!userId) {
            return res.status(400).json({ message: "userId is required to complete request" });
        }

=======
>>>>>>> feature/backend-sprint2
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

        if (request.acceptedBy.toString() !== userId) {
            return res.status(403).json({
                message: "Only assigned user can complete"
            });
        }

        request.status = 'COMPLETED';
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


<<<<<<< HEAD
module.exports = router;
=======
// CLEANUP (optional but useful)
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
>>>>>>> feature/backend-sprint2
