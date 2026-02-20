const express = require('express');
const router = express.Router();
const Outlet = require('../models/Outlet');

// CREATE outlet
router.post('/', async (req, res) => {
  try {
    const outlet = await Outlet.create(req.body);
    res.status(201).json(outlet);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET all outlets
router.get('/', async (req, res) => {
  try {
    const outlets = await Outlet.find();
    res.json(outlets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const updatedOutlet = await Outlet.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedOutlet) {
      return res.status(404).json({ message: "Outlet not found" });
    }

    res.json(updatedOutlet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedOutlet = await Outlet.findByIdAndDelete(req.params.id);

    if (!deletedOutlet) {
      return res.status(404).json({ message: "Outlet not found" });
    }

    res.json({ message: "Outlet deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;

