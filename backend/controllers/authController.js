// controllers/authController.js - Authentication controller
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const pool = require('../config/db');

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role || 'customer'
        },
        process.env.JWT_SECRET || 'your_secret_key',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Customer Registration
const registerCustomer = async (req, res) => {
    try {
        const { email, password, phone, firstName, lastName, address, city } = req.body;

        // Validation
        if (!email || !password || !phone || !firstName || !address || !city) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        const connection = await pool.getConnection();

        try {
            // Check if email exists
            const [existingUser] = await connection.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password_hash, phone, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, phone, firstName, lastName || '']
            );

            const userId = userResult.insertId;

            // Create customer profile
            await connection.query(
                'INSERT INTO customers (user_id, address, city) VALUES (?, ?, ?)',
                [userId, address, city]
            );

            // Generate token
            const token = generateToken({
                id: userId,
                email: email,
                role: 'customer'
            });

            res.status(201).json({
                message: 'Customer registered successfully',
                token: token,
                user: {
                    id: userId,
                    email: email,
                    firstName: firstName,
                    role: 'customer'
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Customer Login
const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const connection = await pool.getConnection();

        try {
            const [users] = await connection.query(
                'SELECT u.id, u.email, u.password_hash, u.first_name, u.is_active FROM users u WHERE u.email = ? AND u.id IN (SELECT user_id FROM customers)',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const user = users[0];

            if (!user.is_active) {
                return res.status(401).json({ message: 'Account is inactive' });
            }

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            // Generate token
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: 'customer'
            });

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    role: 'customer'
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Admin Registration (Protected)
const registerAdmin = async (req, res) => {
    try {
        const { email, password, phone, firstName, lastName, role, hubLocation, department } = req.body;

        if (!email || !password || !phone || !firstName || !role) {
            return res.status(400).json({ message: 'Required fields missing' });
        }

        const validRoles = ['super_admin', 'hub_manager', 'collection_staff', 'processor'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const connection = await pool.getConnection();

        try {
            // Check if email exists
            const [existingUser] = await connection.query(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );

            if (existingUser.length > 0) {
                return res.status(400).json({ message: 'Email already registered' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [userResult] = await connection.query(
                'INSERT INTO users (email, password_hash, phone, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
                [email, hashedPassword, phone, firstName, lastName || '']
            );

            const userId = userResult.insertId;

            // Create admin profile
            await connection.query(
                'INSERT INTO admins (user_id, role, hub_location, department) VALUES (?, ?, ?, ?)',
                [userId, role, hubLocation || '', department || '']
            );

            res.status(201).json({
                message: 'Admin registered successfully',
                user: {
                    id: userId,
                    email: email,
                    firstName: firstName,
                    role: role
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Server error during admin registration' });
    }
};

// Admin Login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const connection = await pool.getConnection();

        try {
            const [users] = await connection.query(
                'SELECT u.id, u.email, u.password_hash, u.first_name, u.is_active, a.role FROM users u JOIN admins a ON u.id = a.user_id WHERE u.email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const user = users[0];

            if (!user.is_active) {
                return res.status(401).json({ message: 'Account is inactive' });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role
            });

            res.json({
                message: 'Login successful',
                token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    role: user.role
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Get current user profile
const getCurrentUser = async (req, res) => {
    try {
        const connection = await pool.getConnection();

        try {
            const [users] = await connection.query(
                'SELECT id, email, phone, first_name, last_name FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            res.json({
                user: {
                    ...users[0],
                    role: req.user.role
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerCustomer,
    loginCustomer,
    registerAdmin,
    loginAdmin,
    getCurrentUser
};
