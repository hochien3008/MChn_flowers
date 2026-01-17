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
            if (targetId === 'tab-addresses') loadAddresses();
        });
    });

    // Default: Show first tab or URL hash
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
}

function handleHashChange() {
    const hash = window.location.hash.replace('#', '');
    const tabName = hash || 'tab-orders';
    const trigger = document.querySelector(`[data-tab-target="${tabName}"]`);
    
    if (trigger) {
        trigger.click();
    }
}

// ============================================
// Orders Logic
// ============================================
async function loadOrders() {
    const listContainer = document.getElementById('orderList');
    if (!listContainer) return;

    listContainer.innerHTML = '<div class="text-center" style="padding: 2rem;">Đang tải đơn hàng...</div>';

    try {
        const result = await window.API.orders.list({ limit: 10 });
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
        'pending': 'status-pending',
        'confirmed': 'status-info',
        'shipping': 'status-primary',
        'completed': 'status-success',
        'cancelled': 'status-danger'
    };
    return map[status] || '';
}

// ============================================
// Profile Logic
// ============================================
async function loadProfile() {
    try {
        const result = await window.API.user.profile.get();
        const user = result.user;

        if (user) {
            setVal('input[name="full_name"]', user.full_name);
            setVal('input[name="email"]', user.email);
            setVal('input[name="phone"]', user.phone);
            setVal('textarea[name="address"]', user.address); // Note: Current simple profile has only one address field
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
        
        // Update sidebar
        const sidebarName = document.getElementById('sidebarUserName');
        if (sidebarName) sidebarName.textContent = data.full_name;

    } catch (error) {
        window.API.showNotification(error.message || 'Cập nhật thất bại', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu thay đổi';
    }
}

// ============================================
// Address Logic
// ============================================
async function loadAddresses() {
    const container = document.getElementById('addressList');
    if (!container) return;
    
    container.innerHTML = '<div>Đang tải địa chỉ...</div>';

    try {
        // We will call this API manually here since it wasn't in the initial Plan but user asked for it.
        // Assuming api/user/addresses.php exists and follows the structure.
        // We should add UserAPI.addresses to api.js first or call directly.
        // Let's call directly for now using apiRequest to be safe or update api.js in next step.
        // Rely on update api.js step for cleanliness.
        
        if (!window.API.user.addresses) {
             container.innerHTML = 'Chức năng đang cập nhật...';
             return;
        }

        const result = await window.API.user.addresses.list();
        const addresses = result.addresses || [];

        if (addresses.length === 0) {
            container.innerHTML = '<p class="text-muted">Bạn chưa lưu địa chỉ nào.</p>';
        } else {
            container.innerHTML = addresses.map(addr => `
                <div class="address-item ${addr.is_default ? 'default' : ''}" style="border: 1px solid #eee; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; position: relative;">
                    ${addr.is_default ? '<span class="badge badge-success" style="position: absolute; top: 10px; right: 10px; font-size: 0.7rem;">Mặc định</span>' : ''}
                    <div style="font-weight: bold; margin-bottom: 0.25rem;">${addr.name} | ${addr.phone}</div>
                    <div style="color: #555; font-size: 0.9rem;">${addr.address}</div>
                    <div style="color: #777; font-size: 0.85rem;">${addr.ward}, ${addr.district}, ${addr.city}</div>
                    <div style="margin-top: 0.75rem;">
                         <button class="btn-sm btn-outline-danger" onclick="deleteAddress(${addr.id})">Xóa</button>
                         ${!addr.is_default ? `<button class="btn-sm btn-outline-primary" onclick="setDefaultAddress(${addr.id})">Đặt mặc định</button>` : ''}
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Load addresses error:', error);
        container.innerHTML = '<div class="text-danger">Không thể tải địa chỉ.</div>';
    }
}

async function addAddress(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');

    const data = {
        action: 'create',
        name: form.name.value,
        phone: form.phone.value,
        address: form.address.value,
        city: form.city.value,
        district: form.district.value,
        ward: form.ward.value,
        is_default: form.is_default.checked
    };

    try {
        btn.disabled = true;
        await window.API.user.addresses.create(data);
        window.API.showNotification('Thêm địa chỉ thành công', 'success');
        form.reset();
        loadAddresses(); // Reload list
    } catch (error) {
        window.API.showNotification(error.message, 'error');
    } finally {
        btn.disabled = false;
    }
}

async function deleteAddress(id) {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
        await window.API.user.addresses.delete(id);
        loadAddresses();
        window.API.showNotification('Đã xóa địa chỉ', 'success');
    } catch (error) {
        window.API.showNotification(error.message, 'error');
    }
}

async function setDefaultAddress(id) {
    try {
        await window.API.user.addresses.setDefault(id);
        loadAddresses();
        window.API.showNotification('Đã đặt làm mặc định', 'success');
    } catch (error) {
        window.API.showNotification(error.message, 'error');
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
window.addAddress = addAddress;
window.deleteAddress = deleteAddress;
window.setDefaultAddress = setDefaultAddress;
