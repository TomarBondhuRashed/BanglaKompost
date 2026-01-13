// routes/pickups.js - Pickup routes
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    createPickup,
    getCustomerPickups,
    getPickupDetails,
    cancelPickup,
    getEarnings
} = require('../controllers/pickupController');

// Customer pickup routes
router.post('/create', authenticateToken, createPickup);
router.get('/my-pickups', authenticateToken, getCustomerPickups);
router.get('/:pickupId', authenticateToken, getPickupDetails);
router.put('/:pickupId/cancel', authenticateToken, cancelPickup);
router.get('/earnings/summary', authenticateToken, getEarnings);

module.exports = router;
