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

module.exports = router;

