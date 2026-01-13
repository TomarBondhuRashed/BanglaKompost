-- BanglaKompost Database Schema
-- MySQL Database for waste management system

-- Create Database
CREATE DATABASE IF NOT EXISTS banglakompost;

USE banglakompost;

-- ============================================
-- 1. Users Table (Base authentication)
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
);

-- ============================================
-- 2. Customers Table
-- ============================================
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    total_waste_sold DECIMAL(10, 2) DEFAULT 0,
    total_earnings DECIMAL(12, 2) DEFAULT 0,
    account_balance DECIMAL(12, 2) DEFAULT 0,
    waste_type_preference VARCHAR(100),
    preferred_pickup_days VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_city (city)
);

-- ============================================
-- 3. Admins Table
-- ============================================
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    role ENUM(
        'super_admin',
        'hub_manager',
        'collection_staff',
        'processor'
    ) DEFAULT 'collection_staff',
    hub_location VARCHAR(255),
    department VARCHAR(100),
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_role (role),
    INDEX idx_hub_location (hub_location)
);

-- ============================================
-- 4. Pickup Requests Table
-- ============================================
CREATE TABLE pickup_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE,
    pickup_time_slot VARCHAR(20),
    waste_type ENUM(
        'kitchen',
        'market',
        'garden',
        'restaurant',
        'mixed'
    ) NOT NULL,
    is_sorted BOOLEAN DEFAULT FALSE,
    estimated_quantity_kg DECIMAL(8, 2),
    actual_quantity_kg DECIMAL(8, 2),
    status ENUM(
        'requested',
        'scheduled',
        'in_transit',
        'collected',
        'cancelled',
        'completed'
    ) DEFAULT 'requested',
    assigned_admin_id INT,
    hub_id INT,
    notes TEXT,
    payment_amount DECIMAL(10, 2),
    payment_status ENUM(
        'pending',
        'processing',
        'paid',
        'failed'
    ) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_admin_id) REFERENCES admins (id) ON DELETE SET NULL,
    FOREIGN KEY (hub_id) REFERENCES hubs (id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date)
);

-- ============================================
-- 5. Waste Collection Log Table
-- ============================================
CREATE TABLE waste_collection_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pickup_request_id INT NOT NULL,
    collection_date DATE NOT NULL,
    collection_time TIME,
    collected_by_admin_id INT NOT NULL,
    waste_type ENUM(
        'kitchen',
        'market',
        'garden',
        'restaurant',
        'mixed'
    ) NOT NULL,
    is_sorted BOOLEAN DEFAULT FALSE,
    quantity_kg DECIMAL(8, 2) NOT NULL,
    sorting_notes TEXT,
    non_organic_percentage DECIMAL(5, 2),
    hub_received_date DATE,
    hub_received_time TIME,
    received_by_admin_id INT,
    quality_rating INT COMMENT '1-5 rating',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests (id) ON DELETE CASCADE,
    FOREIGN KEY (collected_by_admin_id) REFERENCES admins (id) ON DELETE RESTRICT,
    FOREIGN KEY (received_by_admin_id) REFERENCES admins (id) ON DELETE SET NULL,
    INDEX idx_collection_date (collection_date),
    INDEX idx_hub_received_date (hub_received_date)
);

-- ============================================
-- 6. Composting Process Table
-- ============================================
CREATE TABLE composting_processes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    waste_collection_log_id INT NOT NULL,
    process_start_date DATE NOT NULL,
    process_start_time TIME,
    processor_admin_id INT NOT NULL,
    batch_number VARCHAR(50) UNIQUE,
    initial_quantity_kg DECIMAL(8, 2),
    final_quantity_kg DECIMAL(8, 2),
    compost_grade VARCHAR(50),
    status ENUM(
        'processing',
        'fermenting',
        'curing',
        'ready',
        'packaged',
        'sold'
    ) DEFAULT 'processing',
    estimated_completion_date DATE,
    actual_completion_date DATE,
    temperature_log JSON,
    moisture_level_log JSON,
    quality_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (waste_collection_log_id) REFERENCES waste_collection_logs (id) ON DELETE CASCADE,
    FOREIGN KEY (processor_admin_id) REFERENCES admins (id) ON DELETE RESTRICT,
    INDEX idx_batch_number (batch_number),
    INDEX idx_status (status),
    INDEX idx_estimated_completion_date (estimated_completion_date)
);

-- ============================================
-- 7. Hubs Table (Local collection centers)
-- ============================================
CREATE TABLE hubs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hub_name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    manager_admin_id INT,
    phone VARCHAR(20),
    storage_capacity_kg INT,
    current_storage_kg DECIMAL(10, 2) DEFAULT 0,
    status ENUM(
        'active',
        'inactive',
        'maintenance'
    ) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_admin_id) REFERENCES admins (id) ON DELETE SET NULL,
    INDEX idx_city (city),
    INDEX idx_status (status)
);

-- ============================================
-- 8. Payments Table
-- ============================================
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    pickup_request_id INT,
    payment_date DATE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method ENUM(
        'cash',
        'bank_transfer',
        'mobile_banking',
        'check'
    ) DEFAULT 'cash',
    transaction_id VARCHAR(100),
    status ENUM(
        'pending',
        'completed',
        'failed',
        'refunded'
    ) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
    FOREIGN KEY (pickup_request_id) REFERENCES pickup_requests (id) ON DELETE SET NULL,
    INDEX idx_customer_id (customer_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status)
);

-- ============================================
-- 9. Compost Products Table (For sales tracking)
-- ============================================
CREATE TABLE compost_products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    batch_id INT NOT NULL,
    product_name VARCHAR(100),
    quantity_kg DECIMAL(10, 2),
    grade VARCHAR(50),
    production_date DATE,
    expiry_date DATE,
    price_per_kg DECIMAL(8, 2),
    available_quantity_kg DECIMAL(10, 2),
    status ENUM(
        'in_stock',
        'sold_out',
        'expired'
    ) DEFAULT 'in_stock',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES composting_processes (id) ON DELETE CASCADE,
    INDEX idx_grade (grade),
    INDEX idx_status (status)
);

-- ============================================
-- 10. Analytics Table (For dashboard reports)
-- ============================================
CREATE TABLE analytics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    date DATE NOT NULL UNIQUE,
    total_waste_collected_kg DECIMAL(12, 2) DEFAULT 0,
    sorted_waste_kg DECIMAL(12, 2) DEFAULT 0,
    unsorted_waste_kg DECIMAL(12, 2) DEFAULT 0,
    total_pickups INT DEFAULT 0,
    completed_pickups INT DEFAULT 0,
    total_compost_produced_kg DECIMAL(12, 2) DEFAULT 0,
    total_payments DECIMAL(14, 2) DEFAULT 0,
    active_customers INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_date (date)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_customers_total_earnings ON customers (total_earnings);

CREATE INDEX idx_pickups_created_at ON pickup_requests (created_at);

CREATE INDEX idx_payments_created_at ON payments (created_at);

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample admin user
INSERT INTO
    users (
        email,
        password_hash,
        phone,
        first_name,
        last_name
    )
VALUES (
        'admin@banglakompost.com',
        '$2b$10$example_hash_do_not_use',
        '01700000001',
        'Admin',
        'User'
    );

-- Insert sample customer user
INSERT INTO
    users (
        email,
        password_hash,
        phone,
        first_name,
        last_name
    )
VALUES (
        'customer@example.com',
        '$2b$10$example_hash_do_not_use',
        '01700000002',
        'John',
        'Doe'
    );

-- Insert admin profile
INSERT INTO
    admins (
        user_id,
        role,
        hub_location,
        department
    )
VALUES (
        1,
        'super_admin',
        'Main Office',
        'Administration'
    );

-- Insert customer profile
INSERT INTO
    customers (
        user_id,
        address,
        city,
        total_earnings
    )
VALUES (
        2,
        '123 Dhaka Street',
        'Dhaka',
        0
    );

-- Create hub
INSERT INTO
    hubs (
        hub_name,
        location,
        city,
        manager_admin_id
    )
VALUES (
        'Dhaka Central Hub',
        'Dhanmondi, Dhaka',
        'Dhaka',
        1
    );

-- ============================================
-- Views for Easy Querying
-- ============================================

-- Dashboard summary view
CREATE VIEW dashboard_summary AS
SELECT (
        SELECT COUNT(*)
        FROM customers
    ) as total_customers,
    (
        SELECT COUNT(*)
        FROM pickup_requests
        WHERE
            DATE(created_at) = CURDATE()
    ) as today_pickups,
    (
        SELECT SUM(actual_quantity_kg)
        FROM waste_collection_logs
        WHERE
            DATE(collection_date) = CURDATE()
    ) as today_waste_kg,
    (
        SELECT SUM(payment_amount)
        FROM pickup_requests
        WHERE
            DATE(created_at) = CURDATE()
            AND payment_status = 'paid'
    ) as today_revenue,
    (
        SELECT COUNT(*)
        FROM pickup_requests
        WHERE
            status IN ('scheduled', 'in_transit')
    ) as pending_pickups;

-- Customer earnings summary view
CREATE VIEW customer_earnings_summary AS
SELECT
    c.id,
    u.first_name,
    u.email,
    c.total_waste_sold,
    c.total_earnings,
    c.account_balance,
    COUNT(pr.id) as total_pickups,
    SUM(pr.actual_quantity_kg) as total_kg_sold
FROM
    customers c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN pickup_requests pr ON c.id = pr.customer_id
    AND pr.status = 'completed'
GROUP BY
    c.id;