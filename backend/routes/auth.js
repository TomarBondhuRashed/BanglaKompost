// routes/auth.js - Authentication routes
const express = require('express');
const router = express.Router();
const { 
    registerCustomer, 
    loginCustomer, 
    registerAdmin, 
    loginAdmin,
    getCurrentUser 
} = require('../controllers/authController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Customer routes
router.post('/customer/register', registerCustomer);
router.post('/customer/login', loginCustomer);

// Admin routes
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

module.exports = router;
