// controllers/adminController.js - Admin dashboard controller
const pool = require('../config/db');

// Get dashboard summary
const getDashboardSummary = async (req, res) => {
    try {
        const connection = await pool.getConnection();

        try {
            // Get today's stats
            const [todayStats] = await connection.query(
                `SELECT 
                    COUNT(DISTINCT pr.id) as today_pickups,
                    SUM(CASE WHEN pr.status = 'completed' THEN wcl.actual_quantity_kg ELSE 0 END) as today_waste_collected_kg,
                    SUM(CASE WHEN pr.payment_status = 'paid' THEN pr.payment_amount ELSE 0 END) as today_revenue,
                    COUNT(DISTINCT CASE WHEN pr.status IN ('scheduled', 'in_transit') THEN pr.id END) as pending_pickups
                FROM pickup_requests pr
                LEFT JOIN waste_collection_logs wcl ON pr.id = wcl.pickup_request_id
                WHERE DATE(pr.created_at) = CURDATE()`
            );

            // Get overall stats
            const [overallStats] = await connection.query(
                `SELECT 
                    COUNT(DISTINCT c.id) as total_customers,
                    COUNT(DISTINCT pr.id) as total_pickups,
                    SUM(pr.actual_quantity_kg) as total_waste_collected_kg,
                    SUM(CASE WHEN pr.status = 'completed' THEN pr.payment_amount ELSE 0 END) as total_revenue
                FROM customers c
                LEFT JOIN pickup_requests pr ON c.id = pr.customer_id`
            );

            // Get pending pickups
            const [pendingPickups] = await connection.query(
                `SELECT pr.id, pr.waste_type, pr.is_sorted, pr.estimated_quantity_kg, 
                        pr.status, u.first_name, c.address, c.city
                FROM pickup_requests pr
                JOIN customers c ON pr.customer_id = c.id
                JOIN users u ON c.user_id = u.id
                WHERE pr.status IN ('requested', 'scheduled', 'in_transit')
                ORDER BY pr.created_at ASC LIMIT 10`
            );

            res.json({
                today: todayStats[0],
                overall: overallStats[0],
                pendingPickups: pendingPickups
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get dashboard summary error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
};

// Get all pickups (for admin)
const getAllPickups = async (req, res) => {
    try {
        const { status, wasteType, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `SELECT pr.*, u.first_name, u.email, c.address, c.city
                    FROM pickup_requests pr
                    JOIN customers c ON pr.customer_id = c.id
                    JOIN users u ON c.user_id = u.id
                    WHERE 1=1`;
        const params = [];

        if (status) {
            query += ` AND pr.status = ?`;
            params.push(status);
        }

        if (wasteType) {
            query += ` AND pr.waste_type = ?`;
            params.push(wasteType);
        }

        query += ` ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const connection = await pool.getConnection();

        try {
            const [pickups] = await connection.query(query, params);

            // Get total count
            let countQuery = `SELECT COUNT(*) as total FROM pickup_requests WHERE 1=1`;
            const countParams = [];

            if (status) {
                countQuery += ` AND status = ?`;
                countParams.push(status);
            }

            if (wasteType) {
                countQuery += ` AND waste_type = ?`;
                countParams.push(wasteType);
            }

            const [countResult] = await connection.query(countQuery, countParams);
            const total = countResult[0].total;

            res.json({
                pickups: pickups,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(total / limit)
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get all pickups error:', error);
        res.status(500).json({ message: 'Server error fetching pickups' });
    }
};

// Update pickup status
const updatePickupStatus = async (req, res) => {
    try {
        const { pickupId } = req.params;
        const { status, actualQuantityKg, notes } = req.body;
        const adminId = req.user.id;

        const validStatuses = ['scheduled', 'in_transit', 'collected', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const connection = await pool.getConnection();

        try {
            // Get admin details
            const [admins] = await connection.query(
                'SELECT id FROM admins WHERE user_id = ?',
                [adminId]
            );

            if (admins.length === 0) {
                return res.status(403).json({ message: 'Admin profile not found' });
            }

            const adminDbId = admins[0].id;

            // Update pickup
            const updateQuery = `UPDATE pickup_requests SET status = ?, actual_quantity_kg = ? WHERE id = ?`;
            await connection.query(updateQuery, [status, actualQuantityKg || null, pickupId]);

            // Log collection if status is collected
            if (status === 'collected' && actualQuantityKg) {
                const [pickup] = await connection.query(
                    'SELECT waste_type, is_sorted FROM pickup_requests WHERE id = ?',
                    [pickupId]
                );

                await connection.query(
                    `INSERT INTO waste_collection_logs 
                    (pickup_request_id, collection_date, collected_by_admin_id, waste_type, is_sorted, quantity_kg, sorting_notes)
                    VALUES (?, CURDATE(), ?, ?, ?, ?, ?)`,
                    [pickupId, adminDbId, pickup[0].waste_type, pickup[0].is_sorted, actualQuantityKg, notes || '']
                );
            }

            res.json({
                message: `Pickup status updated to ${status}`,
                pickupId: pickupId
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Update pickup status error:', error);
        res.status(500).json({ message: 'Server error updating pickup status' });
    }
};

// Get collection statistics
const getCollectionStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const connection = await pool.getConnection();

        try {
            let query = `SELECT 
                        DATE(wcl.collection_date) as date,
                        COUNT(DISTINCT wcl.id) as collections,
                        SUM(wcl.quantity_kg) as total_kg,
                        SUM(CASE WHEN wcl.is_sorted = 1 THEN wcl.quantity_kg ELSE 0 END) as sorted_kg,
                        SUM(CASE WHEN wcl.is_sorted = 0 THEN wcl.quantity_kg ELSE 0 END) as unsorted_kg,
                        COUNT(DISTINCT wcl.waste_type) as waste_types
                    FROM waste_collection_logs wcl
                    WHERE 1=1`;
            const params = [];

            if (startDate) {
                query += ` AND DATE(wcl.collection_date) >= ?`;
                params.push(startDate);
            }

            if (endDate) {
                query += ` AND DATE(wcl.collection_date) <= ?`;
                params.push(endDate);
            }

            query += ` GROUP BY DATE(wcl.collection_date)
                    ORDER BY date DESC`;

            const [stats] = await connection.query(query, params);

            res.json({ statistics: stats });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get collection stats error:', error);
        res.status(500).json({ message: 'Server error fetching statistics' });
    }
};

// Get compost processing data
const getCompostingData = async (req, res) => {
    try {
        const connection = await pool.getConnection();

        try {
            const [data] = await connection.query(
                `SELECT 
                    cp.id, cp.batch_number, cp.status, cp.process_start_date,
                    cp.estimated_completion_date, cp.initial_quantity_kg, cp.final_quantity_kg,
                    cp.compost_grade, wcl.waste_type, c.user_id
                FROM composting_processes cp
                LEFT JOIN waste_collection_logs wcl ON cp.waste_collection_log_id = wcl.id
                LEFT JOIN pickup_requests pr ON wcl.pickup_request_id = pr.id
                LEFT JOIN customers c ON pr.customer_id = c.id
                ORDER BY cp.process_start_date DESC`
            );

            res.json({ compostingData: data });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get composting data error:', error);
        res.status(500).json({ message: 'Server error fetching composting data' });
    }
};

module.exports = {
    getDashboardSummary,
    getAllPickups,
    updatePickupStatus,
    getCollectionStats,
    getCompostingData
};
