# 🚀 BanglaKompost - Complete Setup Guide

## System Architecture

```
BanglaKompost/
├── frontend/
│   ├── index.html (Main website with pricing)
│   ├── styles.css
│   ├── script.js
│   ├── auth/
│   │   ├── login.html
│   │   ├── signup.html
│   │   └── auth.css
│   └── dashboard/
│       ├── customer/
│       │   ├── index.html
│       │   ├── style.css
│       │   └── script.js
│       └── admin/
│           ├── index.html
│           ├── style.css
│           └── script.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── pickups.js
│   │   └── admin.js
│   └── controllers/
│       ├── authController.js
│       ├── pickupController.js
│       └── adminController.js
└── database/
    └── schema.sql
```

---

## Setup Instructions

### STEP 1: MySQL Database Setup

1. **Open MySQL Command Line or MySQL Workbench**

2. **Create the database and tables:**

   ```sql
   source d:\Website\BanglaKompost\database\schema.sql
   ```

   OR manually run the entire SQL schema file.

3. **Verify tables:**
   ```sql
   USE banglakompost;
   SHOW TABLES;
   ```

---

### STEP 2: Backend Setup (Node.js + Express)

1. **Open PowerShell in `backend/` folder:**

   ```powershell
   cd d:\Website\BanglaKompost\backend
   ```

2. **Create `.env` file from template:**

   ```powershell
   Copy-Item .env.example -Destination .env
   ```

3. **Edit `.env` with your MySQL credentials:**

   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=banglakompost
   PORT=5000
   JWT_SECRET=your_super_secret_key_here
   ```

4. **Install dependencies:**

   ```powershell
   npm install
   ```

5. **Start the backend server:**

   ```powershell
   npm run dev
   # OR for production
   npm start
   ```

   ✅ Server should run on `http://localhost:5000`

---

### STEP 3: Frontend Setup

1. **Update API URL in auth and dashboard files** (if needed):

   - Files: `auth/login.html`, `auth/signup.html`, `dashboard/customer/script.js`, `dashboard/admin/script.js`
   - Change: `const API_URL = 'http://localhost:5000/api'`

2. **Open the website** (from `index.html`):
   - Use VS Code Live Server
   - Or: Right-click `index.html` → Open with → Browser

---

## 📋 User Flows

### Customer Flow

1. **Sign Up** → `auth/signup.html`

   - Email, Phone, Address, City
   - Password (min 6 chars)
   - Account created with automatic token

2. **Login** → `auth/login.html`

   - Email & Password
   - Redirected to Customer Dashboard

3. **Dashboard** → `dashboard/customer/index.html`
   - **New Request**: Create pickup request
     - Select waste type (kitchen, market, garden, restaurant, mixed)
     - Choose sorted or unsorted
     - Enter quantity (50kg min sorted, 100kg min unsorted)
     - Automatic price calculation (2tk/kg sorted, 1tk/kg unsorted)
   - **Track Pickups**: View all pickup status
   - **Earnings**: See total earnings & payments
   - **Profile**: View account info

### Admin Flow

1. **Login** → `auth/login.html` (Admin tab)

   - Admin credentials required
   - Role: super_admin, hub_manager, collection_staff, processor

2. **Dashboard** → `dashboard/admin/index.html`
   - **Overview**: Today's stats, pending pickups
   - **Pickup Requests**: View & update status
   - **Collection Log**: Track waste collected
   - **Composting**: Monitor composting batches
   - **Analytics**: View collection trends
   - **Customers**: Manage customer list

---

## 🔑 API Endpoints

### Authentication

```
POST   /api/auth/customer/register    → Register customer
POST   /api/auth/customer/login       → Customer login
POST   /api/auth/admin/login          → Admin login
GET    /api/auth/me                   → Get current user
```

### Pickups

```
POST   /api/pickups/create            → Create pickup request
GET    /api/pickups/my-pickups        → Get customer's pickups
GET    /api/pickups/:pickupId         → Get pickup details
PUT    /api/pickups/:pickupId/cancel  → Cancel pickup
GET    /api/pickups/earnings/summary  → Get earnings
```

### Admin

```
GET    /api/admin/dashboard           → Dashboard stats
GET    /api/admin/pickups             → All pickups (paginated)
PUT    /api/admin/pickups/:id/status  → Update pickup status
GET    /api/admin/statistics/collection → Collection stats
GET    /api/admin/composting          → Composting data
```

---

## 💾 Database Schema Overview

### Key Tables

1. **users** - Base authentication

   - id, email, password_hash, phone, first_name, last_name

2. **customers** - Customer profiles

   - id, user_id, address, city, total_waste_sold, total_earnings, account_balance

3. **admins** - Admin profiles

   - id, user_id, role, hub_location, department

4. **pickup_requests** - Waste pickup requests

   - id, customer_id, waste_type, is_sorted, estimated_quantity_kg, actual_quantity_kg
   - status, payment_amount, payment_status

5. **waste_collection_logs** - Collected waste tracking

   - id, pickup_request_id, collection_date, quantity_kg, is_sorted

6. **composting_processes** - Compost batches

   - id, batch_number, status, initial_quantity_kg, final_quantity_kg, compost_grade

7. **hubs** - Local collection centers

   - id, hub_name, location, city, manager_admin_id

8. **payments** - Payment records
   - id, customer_id, pickup_request_id, amount, payment_method, status

---

## 🧪 Test Users (After Setup)

### Sample Data (already in schema.sql)

**Admin User:**

- Email: `admin@banglakompost.com`
- Password: (use bcrypt hash)
- Role: super_admin

**Customer User:**

- Email: `customer@example.com`
- Password: (use bcrypt hash)
- City: Dhaka

---

## 📱 Features

### Frontend ✅

- [x] Responsive mobile-first design
- [x] Pricing display (2tk/kg sorted, 1tk/kg unsorted)
- [x] Customer signup/login
- [x] Customer dashboard
  - [x] New pickup requests
  - [x] Track pickups
  - [x] View earnings
  - [x] Profile management
- [x] Admin dashboard (HTML structure ready)

### Backend ✅

- [x] JWT authentication
- [x] Password hashing (bcryptjs)
- [x] Customer registration & login
- [x] Admin login
- [x] Pickup request creation
- [x] Pickup tracking
- [x] Earnings calculation
- [x] Admin dashboard APIs

### Database ✅

- [x] Complete schema with 10+ tables
- [x] Relationships & foreign keys
- [x] Views for easy querying
- [x] Analytics table for reports

---

## 🔐 Security Notes

⚠️ **Before Production:**

1. **Change JWT_SECRET** in `.env`
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** on production
4. **Add CORS restrictions** (currently allows all)
5. **Implement rate limiting** on login endpoints
6. **Hash passwords properly** (bcryptjs already done)
7. **Validate all inputs** on backend
8. **Use prepared statements** for SQL (already done)

---

## 🆘 Troubleshooting

### Connection Error to Database

```
Error: Connection refused
→ Make sure MySQL is running
→ Check DB_PASSWORD in .env
→ Verify DATABASE_NAME is correct
```

### 401 Unauthorized on API calls

```
→ Check if token is stored in localStorage
→ Verify JWT_SECRET matches in .env
→ Login again to get fresh token
```

### CORS Error

```
→ Ensure backend is running on http://localhost:5000
→ Check API_URL in frontend files
→ Backend has CORS enabled by default
```

### Port Already in Use

```
→ Change PORT in .env to 5001, 5002, etc.
→ Or: Kill process on port 5000
```

---

## 📈 Next Steps (Phase 2)

1. **Complete Admin Dashboard** (CSS & JS)
2. **Payment Integration** (bKash, Nagad, etc.)
3. **SMS Notifications** (Twilio)
4. **ML Waste Classification**
5. **IoT Device Integration**
6. **Mobile App** (React Native/Flutter)
7. **Advanced Analytics** (Charts, Reports)
8. **Vendor Portal** for compost sellers
9. **Carbon Impact Calculator**
10. **Sustainability Certification**

---

## 📞 Support

For issues or questions:

- Check error logs in terminal
- Verify `.env` configuration
- Ensure MySQL & Node.js are running
- Check browser console for frontend errors

---

**🌱 Happy composting!**
