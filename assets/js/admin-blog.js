/**
 * Admin Blog Management
 */

document.addEventListener('DOMContentLoaded', async function() {
    await loadBlogPosts();
    setupFilters();
    setupSearch();
});

let currentFilters = {
    status: '',
    search: '',
    page: 1
};

/**
 * Load blog posts list
 */
async function loadBlogPosts(filters = {}) {
    try {
        currentFilters = { ...currentFilters, ...filters };
        
        const params = new URLSearchParams({
            page: currentFilters.page || 1,
            limit: 20
        });
        
        if (currentFilters.status) {
            params.append('status', currentFilters.status);
        }
        
        if (currentFilters.search) {
            params.append('search', currentFilters.search);
        }
        
        const response = await fetch(`/api/admin/blog/list.php?${params.toString()}`, {
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            renderBlogPosts(result.data.posts);
            renderPagination(result.data.pagination);
        } else {
            showNotification('Không thể tải danh sách bài viết: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Failed to load blog posts:', error);
        showNotification('Không thể tải danh sách bài viết', 'error');
    }
}

/**
 * Render blog posts table
 */
function renderBlogPosts(posts) {
    const tbody = document.querySelector('.admin-table tbody');
    
    if (!tbody) return;
    
    if (!posts || posts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    Chưa có bài viết nào
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = posts.map(post => `
        <tr data-post-id="${post.id}">
            <td>
                ${post.image_url 
                    ? `<img src="${post.image_url}" alt="${post.title}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">`
                    : '📝'
                }
            </td>
            <td>
                <div><strong>${post.title || 'N/A'}</strong></div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">
                    ${post.excerpt || post.content?.substring(0, 50) || ''}...
                </div>
            </td>
            <td>${post.author_name || 'N/A'}</td>
            <td>
                <span class="admin-badge ${post.status === 'published' ? 'confirmed' : 'warning'}">
                    ${post.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                </span>
            </td>
            <td>
                <div>Lượt xem: ${post.views || 0}</div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">
                    ${formatDateTime(post.created_at)}
                </div>
            </td>
            <td>
                <div class="admin-action-buttons">
                    <button class="admin-btn-icon" title="Sửa" onclick="editBlogPost(${post.id})">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                    </button>
                    <button class="admin-btn-icon" title="Xóa" onclick="deleteBlogPost(${post.id})">
                        <svg viewBox="0 0 24 24" width="18" height="18">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Setup filters
 */
function setupFilters() {
    const statusFilter = document.querySelector('.admin-filter-bar select');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadBlogPosts({ status: this.value, page: 1 });
        });
    }
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
                loadBlogPosts({ search: this.value, page: 1 });
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
        <button class="admin-page-btn" ${!has_prev ? 'disabled' : ''} onclick="loadBlogPosts({ page: ${current_page - 1} })">
            ‹ Trước
        </button>
        ${Array.from({ length: Math.min(5, total_pages) }, (_, i) => {
            const page = i + 1;
            return `<button class="admin-page-btn ${page === current_page ? 'active' : ''}" onclick="loadBlogPosts({ page: ${page} })">${page}</button>`;
        }).join('')}
        <button class="admin-page-btn" ${!has_next ? 'disabled' : ''} onclick="loadBlogPosts({ page: ${current_page + 1} })">
            Sau ›
        </button>
    `;
}

/**
 * Helper functions
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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
function editBlogPost(id) {
    showNotification('Tính năng sửa bài viết đang phát triển', 'info');
}

function deleteBlogPost(id) {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
        showNotification('Tính năng xóa bài viết đang phát triển', 'info');
    }
}

// Make functions global
window.loadBlogPosts = loadBlogPosts;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;

