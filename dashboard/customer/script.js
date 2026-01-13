// Customer Dashboard JavaScript
const API_URL = 'http://localhost:5000/api';
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupMenuNavigation();
    setupLogout();
    loadUserProfile();
    loadDashboardData();
    setupPickupForm();
});

// Check if user is authenticated
function checkAuthentication() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (!token || userRole !== 'customer') {
        window.location.href = '../../auth/login.html';
        return;
    }

    document.getElementById('userName').textContent = userName || 'Customer';
    document.getElementById('welcomeName').textContent = userName || 'Customer';
}

// Menu Navigation
function setupMenuNavigation() {
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(page).classList.add('active');
            
            if (page === 'pickups') loadAllPickups();
            if (page === 'earnings') loadEarnings();
            if (page === 'profile') loadProfile();
        });
    });

    // Set dashboard as active by default
    document.querySelector('[data-page="dashboard"]').classList.add('active');
}

// Logout
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../../index.html';
    });
}

// Load User Profile
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            currentUser = await response.json();
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/pickups/earnings/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const earnings = data.earnings;
            
            document.getElementById('totalWaste').textContent = Math.round(earnings.total_waste_sold || 0);
            document.getElementById('totalEarnings').textContent = Math.round(earnings.total_earnings || 0);
            document.getElementById('balance').textContent = Math.round(earnings.account_balance || 0);
            document.getElementById('totalPickups').textContent = earnings.total_pickups || 0;
            
            loadRecentPickups();
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
    }
}

// Load Recent Pickups
async function loadRecentPickups() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/pickups/my-pickups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('recentPickups');
            
            if (data.pickups.length === 0) {
                container.innerHTML = '<p class="no-data">No pickups yet. <a href="#new-request" class="action-link">Create one</a></p>';
                return;
            }

            const recent = data.pickups.slice(0, 3);
            container.innerHTML = recent.map(pickup => `
                <div class="pickup-item ${pickup.status}">
                    <div class="pickup-info">
                        <h4>${pickup.waste_type}</h4>
                        <p>${pickup.estimated_quantity_kg}kg - ${pickup.is_sorted ? 'Sorted' : 'Unsorted'}</p>
                    </div>
                    <div>
                        <strong>৳ ${pickup.payment_amount}</strong>
                        <p>${pickup.payment_status}</p>
                    </div>
                    <div>
                        <p class="status-badge">${pickup.status}</p>
                    </div>
                    <div>
                        <small>${new Date(pickup.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Recent pickups error:', error);
    }
}

// Load All Pickups
async function loadAllPickups() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/pickups/my-pickups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const container = document.getElementById('allPickups');
            
            if (data.pickups.length === 0) {
                container.innerHTML = '<p class="no-data">No pickups yet.</p>';
                return;
            }

            container.innerHTML = data.pickups.map(pickup => `
                <div class="pickup-item ${pickup.status}">
                    <div class="pickup-info">
                        <h4>${pickup.waste_type}</h4>
                        <p>${pickup.estimated_quantity_kg}kg - ${pickup.is_sorted ? 'Sorted' : 'Unsorted'}</p>
                    </div>
                    <div>
                        <strong>৳ ${pickup.payment_amount}</strong>
                        <p>${pickup.payment_status}</p>
                    </div>
                    <div>
                        <p>${pickup.status}</p>
                    </div>
                    <div>
                        <small>${new Date(pickup.created_at).toLocaleDateString()}</small>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('All pickups error:', error);
    }
}

// Setup Pickup Form
function setupPickupForm() {
    const form = document.getElementById('pickupForm');
    const isSorted = document.getElementById('isSorted');
    const quantity = document.getElementById('quantity');
    const wasteType = document.getElementById('wasteType');

    const updateCalculation = () => {
        const rate = isSorted.checked ? 2 : 1;
        const qty = parseFloat(quantity.value) || 0;
        const minQty = isSorted.checked ? 50 : 100;

        document.getElementById('rateDisplay').textContent = `৳ ${rate}/kg`;
        document.getElementById('totalAmount').textContent = `৳ ${(qty * rate).toFixed(0)}`;

        const warning = document.getElementById('minWarning');
        if (qty < minQty && qty > 0) {
            warning.textContent = `Minimum ${minQty}kg required`;
        } else {
            warning.textContent = '';
        }
    };

    isSorted.addEventListener('change', updateCalculation);
    quantity.addEventListener('input', updateCalculation);
    wasteType.addEventListener('change', updateCalculation);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            wasteType: wasteType.value,
            isSorted: isSorted.checked,
            estimatedQuantityKg: parseFloat(quantity.value),
            notes: document.getElementById('notes').value
        };

        const token = localStorage.getItem('token');

        try {
            const response = await fetch(`${API_URL}/pickups/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('✅ Pickup request created! You will be contacted within 24 hours.', 'success');
                form.reset();
                setTimeout(() => {
                    document.querySelector('[data-page="dashboard"]').click();
                    loadDashboardData();
                }, 1500);
            } else {
                showNotification(result.message || 'Error creating pickup', 'error');
            }
        } catch (error) {
            console.error('Pickup error:', error);
            showNotification('Connection error', 'error');
        }
    });
}

// Load Earnings
async function loadEarnings() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/pickups/earnings/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const e = data.earnings;

            document.getElementById('earningsWaste').textContent = Math.round(e.total_waste_sold || 0);
            document.getElementById('earningsTotal').textContent = Math.round(e.total_earnings || 0);
            document.getElementById('earningsPaid').textContent = Math.round(e.total_paid || 0);
            document.getElementById('earningsPending').textContent = Math.round((e.total_earnings - e.total_paid) || 0);
        }
    } catch (error) {
        console.error('Earnings load error:', error);
    }
}

// Load Profile
async function loadProfile() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const user = data.user;

            document.getElementById('profileInfo').innerHTML = `
                <div>
                    <p><strong>Name:</strong> ${user.first_name} ${user.last_name || ''}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Phone:</strong> ${user.phone}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

// Show Notification
function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification notification-${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}
