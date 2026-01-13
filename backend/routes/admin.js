// routes/admin.js - Admin routes
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const {
    getDashboardSummary,
    getAllPickups,
    updatePickupStatus,
    getCollectionStats,
    getCompostingData
} = require('../controllers/adminController');

// Dashboard routes
router.get('/dashboard', authenticateToken, authorizeRole(['super_admin', 'hub_manager', 'collection_staff', 'processor']), getDashboardSummary);

// Pickup management
router.get('/pickups', authenticateToken, authorizeRole(['super_admin', 'hub_manager', 'collection_staff']), getAllPickups);
router.put('/pickups/:pickupId/status', authenticateToken, authorizeRole(['super_admin', 'hub_manager', 'collection_staff']), updatePickupStatus);

// Statistics
router.get('/statistics/collection', authenticateToken, authorizeRole(['super_admin', 'hub_manager']), getCollectionStats);

// Composting data
router.get('/composting', authenticateToken, authorizeRole(['super_admin', 'hub_manager', 'processor']), getCompostingData);

module.exports = router;
