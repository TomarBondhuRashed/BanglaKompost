// Admin Dashboard JavaScript
const API_URL = 'http://localhost:5000/api';
let currentPickupId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupMenuNavigation();
    setupLogout();
    loadDashboard();
    setupUpdateModal();
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (!token || !['super_admin', 'hub_manager', 'collection_staff', 'processor'].includes(userRole)) {
        window.location.href = '../../auth/login.html';
        return;
    }

    document.getElementById('adminName').textContent = `${userName} (${userRole})`;
}

function setupMenuNavigation() {
    document.querySelectorAll('.menu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            
            document.querySelectorAll('.menu-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(page).classList.add('active');
            
            if (page === 'pickups') loadPickups();
            if (page === 'collection') loadCollectionStats();
            if (page === 'composting') loadCompostingData();
        });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '../../index.html';
    });
}

async function loadDashboard() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            
            document.getElementById('totalCustomers').textContent = data.overall.total_customers || 0;
            document.getElementById('todayPickups').textContent = data.today.today_pickups || 0;
            document.getElementById('todayWaste').textContent = Math.round(data.today.today_waste_collected_kg || 0);
            document.getElementById('todayRevenue').textContent = Math.round(data.today.today_revenue || 0);
            document.getElementById('pendingPickups').textContent = data.today.pending_pickups || 0;
            document.getElementById('totalPickups').textContent = data.overall.total_pickups || 0;
            
            document.getElementById('overallWaste').textContent = Math.round(data.overall.total_waste_collected_kg || 0);
            document.getElementById('overallRevenue').textContent = Math.round(data.overall.total_revenue || 0);

            displayPendingPickups(data.pendingPickups);
        }
    } catch (error) {
        console.error('Dashboard load error:', error);
        showNotification('Error loading dashboard', 'error');
    }
}

function displayPendingPickups(pickups) {
    const container = document.getElementById('pendingPickupsList');
    
    if (pickups.length === 0) {
        container.innerHTML = '<p class="no-data">No pending pickups</p>';
        return;
    }

    let html = '<div class="table-header"><div>Customer</div><div>Type</div><div>Quantity</div><div>Status</div><div>Action</div></div>';
    
    html += pickups.map(pickup => `
        <div class="table-row">
            <div>${pickup.first_name}</div>
            <div>${pickup.waste_type}</div>
            <div>${pickup.estimated_quantity_kg}kg</div>
            <div>${pickup.status}</div>
            <div>
                <button class="btn-update" onclick="openUpdateModal(${pickup.id})">Update</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

async function loadPickups() {
    const token = localStorage.getItem('token');
    const status = document.getElementById('pickupStatusFilter')?.value;
    const wasteType = document.getElementById('wasteTypeFilter')?.value;

    try {
        let url = `${API_URL}/admin/pickups?page=1&limit=20`;
        if (status) url += `&status=${status}`;
        if (wasteType) url += `&wasteType=${wasteType}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayPickupsTable(data.pickups);
        }
    } catch (error) {
        console.error('Pickups load error:', error);
    }
}

function displayPickupsTable(pickups) {
    const container = document.getElementById('pickupsList');

    if (pickups.length === 0) {
        container.innerHTML = '<p class="no-data">No pickups found</p>';
        return;
    }

    let html = '<div class="table-header"><div>Customer</div><div>Type</div><div>Quantity</div><div>Status</div><div>Action</div></div>';
    
    html += pickups.map(pickup => `
        <div class="table-row">
            <div>${pickup.first_name} (${pickup.email})</div>
            <div>${pickup.waste_type}</div>
            <div>${pickup.estimated_quantity_kg}kg</div>
            <div><span class="status-badge">${pickup.status}</span></div>
            <div>
                <button class="btn-update" onclick="openUpdateModal(${pickup.id})">Update</button>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function openUpdateModal(pickupId) {
    currentPickupId = pickupId;
    document.getElementById('updateModal').classList.add('show');
}

function setupUpdateModal() {
    const modal = document.getElementById('updateModal');
    const closeBtn = modal.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('show');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    document.getElementById('updateForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const data = {
            status: document.getElementById('newStatus').value,
            actualQuantityKg: parseFloat(document.getElementById('actualQuantity').value),
            notes: document.getElementById('updateNotes').value
        };

        try {
            const response = await fetch(`${API_URL}/admin/pickups/${currentPickupId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showNotification('Pickup updated successfully', 'success');
                modal.classList.remove('show');
                loadDashboard();
                loadPickups();
            } else {
                showNotification('Error updating pickup', 'error');
            }
        } catch (error) {
            console.error('Update error:', error);
            showNotification('Error updating pickup', 'error');
        }
    });
}

async function loadCollectionStats() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/statistics/collection`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const todayStats = data.statistics[0] || {};

            document.getElementById('collectionsToday').textContent = todayStats.collections || 0;
            document.getElementById('totalWeightToday').textContent = Math.round(todayStats.total_kg || 0);
            document.getElementById('sortedWasteToday').textContent = Math.round(todayStats.sorted_kg || 0);
            document.getElementById('unsortedWasteToday').textContent = Math.round(todayStats.unsorted_kg || 0);

            displayCollectionTable(data.statistics);
        }
    } catch (error) {
        console.error('Collection stats error:', error);
    }
}

function displayCollectionTable(stats) {
    const container = document.getElementById('collectionTable');

    if (stats.length === 0) {
        container.innerHTML = '<p class="no-data">No data</p>';
        return;
    }

    let html = '<div class="table-header"><div>Date</div><div>Collections</div><div>Total Kg</div><div>Sorted</div><div>Unsorted</div></div>';
    
    html += stats.map(stat => `
        <div class="table-row">
            <div>${stat.date}</div>
            <div>${stat.collections}</div>
            <div>${Math.round(stat.total_kg || 0)}kg</div>
            <div>${Math.round(stat.sorted_kg || 0)}kg</div>
            <div>${Math.round(stat.unsorted_kg || 0)}kg</div>
        </div>
    `).join('');

    container.innerHTML = html;
}

async function loadCompostingData() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/composting`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            displayCompostingTable(data.compostingData);
        }
    } catch (error) {
        console.error('Composting data error:', error);
    }
}

function displayCompostingTable(data) {
    const container = document.getElementById('compostingTable');

    if (data.length === 0) {
        container.innerHTML = '<p class="no-data">No composting batches</p>';
        return;
    }

    let html = '<div class="table-header"><div>Batch</div><div>Status</div><div>Initial Qty</div><div>Final Qty</div><div>Grade</div></div>';
    
    html += data.map(batch => `
        <div class="table-row">
            <div>${batch.batch_number || 'N/A'}</div>
            <div>${batch.status}</div>
            <div>${batch.initial_quantity_kg || 0}kg</div>
            <div>${batch.final_quantity_kg || 0}kg</div>
            <div>${batch.compost_grade || 'N/A'}</div>
        </div>
    `).join('');

    container.innerHTML = html;
}

function showNotification(message, type) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification notification-${type} show`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}
