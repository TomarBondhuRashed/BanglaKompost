// controllers/pickupController.js - Pickup request controller
const pool = require('../config/db');

// Create pickup request
const createPickup = async (req, res) => {
    try {
        const { wasteType, isSorted, estimatedQuantityKg, notes } = req.body;
        const userId = req.user.id;

        if (!wasteType || estimatedQuantityKg === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const connection = await pool.getConnection();

        try {
            // Get customer ID
            const [customers] = await connection.query(
                'SELECT id FROM customers WHERE user_id = ?',
                [userId]
            );

            if (customers.length === 0) {
                return res.status(404).json({ message: 'Customer profile not found' });
            }

            const customerId = customers[0].id;

            // Check minimum quantity
            const minQuantity = isSorted ? 50 : 100;
            if (estimatedQuantityKg < minQuantity) {
                return res.status(400).json({ 
                    message: `Minimum ${minQuantity}kg required for ${isSorted ? 'sorted' : 'unsorted'} waste` 
                });
            }

            // Calculate payment amount
            const ratePerKg = isSorted ? 2 : 1;
            const paymentAmount = estimatedQuantityKg * ratePerKg;

            // Create pickup request
            const [result] = await connection.query(
                `INSERT INTO pickup_requests 
                (customer_id, waste_type, is_sorted, estimated_quantity_kg, payment_amount, notes, status)
                VALUES (?, ?, ?, ?, ?, ?, 'requested')`,
                [customerId, wasteType, isSorted, estimatedQuantityKg, paymentAmount, notes || '']
            );

            res.status(201).json({
                message: 'Pickup request created successfully',
                pickupId: result.insertId,
                estimatedPayment: paymentAmount,
                pickupDetails: {
                    wasteType: wasteType,
                    isSorted: isSorted,
                    quantity: estimatedQuantityKg,
                    rate: `${ratePerKg}tk/kg`,
                    totalAmount: paymentAmount
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Create pickup error:', error);
        res.status(500).json({ message: 'Server error creating pickup request' });
    }
};

// Get customer's pickups
const getCustomerPickups = async (req, res) => {
    try {
        const userId = req.user.id;
        const connection = await pool.getConnection();

        try {
            const [pickups] = await connection.query(
                `SELECT 
                    pr.id, pr.waste_type, pr.is_sorted, pr.estimated_quantity_kg, 
                    pr.actual_quantity_kg, pr.status, pr.payment_amount, pr.payment_status,
                    pr.request_date, pr.scheduled_date, pr.created_at
                FROM pickup_requests pr
                JOIN customers c ON pr.customer_id = c.id
                WHERE c.user_id = ?
                ORDER BY pr.created_at DESC`,
                [userId]
            );

            res.json({
                pickups: pickups,
                total: pickups.length
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get pickups error:', error);
        res.status(500).json({ message: 'Server error fetching pickups' });
    }
};

// Get pickup details
const getPickupDetails = async (req, res) => {
    try {
        const { pickupId } = req.params;
        const userId = req.user.id;

        const connection = await pool.getConnection();

        try {
            const [pickups] = await connection.query(
                `SELECT pr.*, wcl.collection_date, wcl.actual_quantity_kg as final_quantity
                FROM pickup_requests pr
                LEFT JOIN waste_collection_logs wcl ON pr.id = wcl.pickup_request_id
                WHERE pr.id = ? AND pr.customer_id IN (SELECT id FROM customers WHERE user_id = ?)`,
                [pickupId, userId]
            );

            if (pickups.length === 0) {
                return res.status(404).json({ message: 'Pickup request not found' });
            }

            res.json({ pickup: pickups[0] });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get pickup details error:', error);
        res.status(500).json({ message: 'Server error fetching pickup details' });
    }
};

// Cancel pickup request
const cancelPickup = async (req, res) => {
    try {
        const { pickupId } = req.params;
        const userId = req.user.id;

        const connection = await pool.getConnection();

        try {
            // Check if pickup belongs to user and can be cancelled
            const [pickups] = await connection.query(
                `SELECT pr.id, pr.status FROM pickup_requests pr
                WHERE pr.id = ? AND pr.customer_id IN (SELECT id FROM customers WHERE user_id = ?)`,
                [pickupId, userId]
            );

            if (pickups.length === 0) {
                return res.status(404).json({ message: 'Pickup request not found' });
            }

            if (!['requested', 'scheduled'].includes(pickups[0].status)) {
                return res.status(400).json({ message: 'Cannot cancel pickup in this status' });
            }

            // Cancel pickup
            await connection.query(
                'UPDATE pickup_requests SET status = ? WHERE id = ?',
                ['cancelled', pickupId]
            );

            res.json({ message: 'Pickup request cancelled successfully' });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Cancel pickup error:', error);
        res.status(500).json({ message: 'Server error cancelling pickup' });
    }
};

// Get customer's earnings
const getEarnings = async (req, res) => {
    try {
        const userId = req.user.id;

        const connection = await pool.getConnection();

        try {
            const [earnings] = await connection.query(
                `SELECT 
                    c.total_earnings,
                    c.account_balance,
                    c.total_waste_sold,
                    COUNT(pr.id) as total_pickups,
                    SUM(CASE WHEN pr.status = 'completed' THEN pr.actual_quantity_kg ELSE 0 END) as completed_kg,
                    SUM(CASE WHEN pr.status = 'completed' AND pr.payment_status = 'paid' THEN pr.payment_amount ELSE 0 END) as total_paid
                FROM customers c
                LEFT JOIN pickup_requests pr ON c.id = pr.customer_id
                WHERE c.user_id = ?
                GROUP BY c.id`,
                [userId]
            );

            if (earnings.length === 0) {
                return res.status(404).json({ message: 'Customer profile not found' });
            }

            res.json({ earnings: earnings[0] });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ message: 'Server error fetching earnings' });
    }
};

module.exports = {
    createPickup,
    getCustomerPickups,
    getPickupDetails,
    cancelPickup,
    getEarnings
};
