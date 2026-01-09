/**
 * Admin Staff Management
 */

document.addEventListener('DOMContentLoaded', async function() {
    await loadStaff();
    setupSearch();
});

let currentFilters = {
    search: '',
    page: 1
};

/**
 * Load staff list
 */
async function loadStaff(filters = {}) {
    try {
        currentFilters = { ...currentFilters, ...filters };
        
        const params = new URLSearchParams({
            page: currentFilters.page || 1,
            limit: 20
        });
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        const response = await fetch(`/api/admin/staff/list.php?${params.toString()}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderStaff(result.data.staff);
            renderPagination(result.data.pagination);
        } else {
            showNotification('Không thể tải danh sách nhân viên: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to load staff:', error);
        showNotification('Không thể tải danh sách nhân viên', 'error');
    }
}

/**
 * Render staff table
 */
function renderStaff(staff) {
    const tbody = document.querySelector('.admin-table tbody');
    
    if (!tbody) return;
    
    if (!staff || staff.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    Chưa có nhân viên nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = staff.map(member => `
        <tr data-staff-id="${member.id}">
            <td>
                <div><strong>${member.full_name || 'N/A'}</strong></div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">
                    Tham gia từ ${formatDate(member.created_at)}
                </div>
            </td>
            <td>${member.email || 'N/A'}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>
                <span class="admin-badge ${member.status === 'active' ? 'confirmed' : 'canceled'}">
                    ${getStatusLabel(member.status)}
                </span>
            </td>
            <td>
                <div class="admin-action-buttons">
                    <button class="admin-btn-icon" title="Sửa" onclick="editStaff(${member.id})">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="admin-btn-icon" 
                            title="${member.status === 'active' ? 'Khóa' : 'Mở khóa'}" 
                            onclick="toggleStaffStatus(${member.id}, '${member.status === 'active' ? 'suspended' : 'active'}')">
                        ${member.status === 'active' ? '🔒' : '🔓'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Setup search
 */
function setupSearch() {
    const searchInput = document.querySelector('.admin-search-box input');
    
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                loadStaff({ search: this.value, page: 1 });
            }, 500);
        });
    }
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const paginationContainer = document.querySelector('.admin-pagination');
    if (!paginationContainer || !pagination) return;
    
    const { current_page, total_pages, has_prev, has_next } = pagination;
    
    paginationContainer.innerHTML = `
        <button class="admin-page-btn" ${!has_prev ? 'disabled' : ''} onclick="loadStaff({ page: ${current_page - 1} })">
            ‹ Trước
        </button>
        ${Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
            const page = i + 1;
            return `<button class="admin-page-btn ${page === current_page ? 'active' : ''}" onclick="loadStaff({ page: ${page} })">${page}</button>`;
        }).join('')}
        <button class="admin-page-btn" ${!has_next ? 'disabled' : ''} onclick="loadStaff({ page: ${current_page + 1} })">
            Sau ›
        </button>
    `;
}

/**
 * Helper functions
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Hoạt động',
        'suspended': 'Đã khóa',
        'banned': 'Đã cấm'
    };
    return labels[status] || status;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `admin-notification admin-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Placeholder functions
function editStaff(id) {
    showNotification('Tính năng sửa nhân viên đang phát triển', 'info');
}

function toggleStaffStatus(id, newStatus) {
    // TODO: Implement API call
    showNotification('Tính năng cập nhật trạng thái đang phát triển', 'info');
}

// Make functions global
window.loadStaff = loadStaff;
window.editStaff = editStaff;
window.toggleStaffStatus = toggleStaffStatus;

