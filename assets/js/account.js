/**
 * Account Page Logic
 * Handles tabs for Profile, Orders, Password, and data fetching
 */

document.addEventListener('DOMContentLoaded', async function () {
    // 1. Check Authentication
    await checkAuth();

    // 2. Initialize Tabs
    initTabs();

    // 3. Load Initial Data (Default Tab: Orders)
    loadOrders();
    loadProfile();
});

async function checkAuth() {
    if (!window.API || !window.API.auth) return;
    try {
        const user = await window.API.auth.check();
        if (!user) {
            window.location.href = '../auth/login.html';
        } else {
            // Update sidebar user info if needed
            const userNameEl = document.getElementById('sidebarUserName');
            if (userNameEl) userNameEl.textContent = user.full_name || 'Khách hàng';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '../auth/login.html';
    }
}

function initTabs() {
    const triggers = document.querySelectorAll('[data-tab-target]');
    triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all triggers
            triggers.forEach(t => t.classList.remove('active'));
            // Add active class to clicked trigger
            trigger.classList.add('active');

            // Hide all tab contents
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.style.display = 'none';
                pane.classList.remove('active');
            });

            // Show target tab content
            const targetId = trigger.getAttribute('data-tab-target');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.style.display = 'block';
                setTimeout(() => targetPane.classList.add('active'), 50); // Fade in
            }

            // Load data if needed based on tab
            if (targetId === 'tab-orders') loadOrders();
            if (targetId === 'tab-profile') loadProfile();
        });
    });

    // Default: Show first tab or URL hash
    const hash = window.location.hash.replace('#', '');
    const defaultTab = hash ? document.querySelector(`[data-tab-target="tab-${hash}"]`) : document.querySelector('[data-tab-target="tab-orders"]');
    if (defaultTab) defaultTab.click();
}

// ============================================
// Orders Logic
// ============================================
async function loadOrders() {
    const listContainer = document.getElementById('orderList');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center" style="padding: 2rem;">Đang tải đơn hàng...</div>';

    try {
        const result = await window.API.orders.list({ limit: 10 }); // You might need to add this method to api.js if missing
        const orders = result.orders || [];

        if (orders.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">Bạn chưa có đơn hàng nào. <a href="../index.html">Mua sắm ngay</a></div>';
            return;
        }

        listContainer.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">#${order.order_number}</div>
                        <div class="order-date">${new Date(order.created_at).toLocaleString('vi-VN')}</div>
                    </div>
                    <span class="order-status ${getStatusClass(order.status)}">${getStatusLabel(order.status)}</span>
                </div>
                <div class="order-body">
                    <div class="order-summary">
                        ${order.shipping_name ? `<div>Giao đến: <strong>${order.shipping_name}</strong></div>` : ''}
                        <div>Tổng tiền: <strong class="price-text">${formatPrice(order.total)}</strong></div>
                    </div>
                </div>
                <div class="order-footer">
                    <button class="btn-outline" onclick="viewOrderDetail(${order.id})">Xem chi tiết</button>
                    ${order.status === 'pending' ? `<button class="btn-danger" onclick="cancelOrder(${order.id})">Hủy đơn</button>` : ''}
                    ${order.status === 'completed' ? `<button class="btn-primary" onclick="reorder(${order.id})">Mua lại</button>` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Load orders failed:', error);
        listContainer.innerHTML = '<div class="error-state">Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.</div>';
    }
}

function getStatusLabel(status) {
    const map = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao',
        'completed': 'Hoàn thành',
        'cancelled': 'Đã hủy'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'pending': 'status-pending', // yellow/orange
        'confirmed': 'status-info', // blue
        'shipping': 'status-primary', // purple/brand
        'completed': 'status-success', // green
        'cancelled': 'status-danger' // red
    };
    return map[status] || '';
}

// ============================================
// Profile Logic
// ============================================
async function loadProfile() {
    try {
        const result = await window.API.user.profile.get(); // Ensure this exists in api.js
        const user = result.user;

        if (user) {
            setVal('input[name="full_name"]', user.full_name);
            setVal('input[name="email"]', user.email);
            setVal('input[name="phone"]', user.phone);
            setVal('input[name="address"]', user.address);
        }
    } catch (error) {
        console.error('Load profile failed:', error);
    }
}

async function updateProfile(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    
    const data = {
        full_name: form.full_name.value,
        phone: form.phone.value,
        address: form.address.value
    };

    try {
        btn.disabled = true;
        btn.textContent = 'Đang lưu...';

        await window.API.user.profile.update(data);
        window.API.showNotification('Cập nhật hồ sơ thành công!', 'success');
    } catch (error) {
        window.API.showNotification(error.message || 'Cập nhật thất bại', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu thay đổi';
    }
}

// ============================================
// Password Logic
// ============================================
async function changePassword(e) {
    e.preventDefault();
    const form = e.target;
    const currentPass = form.current_password.value;
    const newPass = form.new_password.value;
    const confirmPass = form.confirm_password.value;

    if (newPass !== confirmPass) {
        window.API.showNotification('Mật khẩu mới không khớp', 'error');
        return;
    }

    try {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        await window.API.user.password.update(currentPass, newPass);
        window.API.showNotification('Đổi mật khẩu thành công!', 'success');
        form.reset();
    } catch (error) {
        window.API.showNotification(error.message || 'Đổi mật khẩu thất bại', 'error');
    } finally {
        const btn = form.querySelector('button[type="submit"]');
        btn.disabled = false;
        btn.textContent = 'Đổi mật khẩu';
    }
}

// ============================================
// Helpers
// ============================================
function setVal(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.value = value || '';
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// Attach functions to window for onclick access
window.updateProfile = updateProfile;
window.changePassword = changePassword;
window.loadOrders = loadOrders;
