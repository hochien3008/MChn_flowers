/**
 * Admin Blog Management
 */

document.addEventListener('DOMContentLoaded', async function() {
    await loadBlogPosts();
    setupFilters();
    setupSearch();
    setupImagePreview();
});

let currentFilters = {
    category: '',
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

        if (currentFilters.category) {
            params.append('category', currentFilters.category);
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
                <td colspan="8" style="text-align: center; padding: 2rem;">
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
            <td>
                ${formatCategory(post.category)}
            </td>
            <td>
                ${post.author_name || 'N/A'}
            </td>
            <td>${formatDateTime(post.created_at)}</td>
            <td>${post.views || 0}</td>
            <td>
                <span class="admin-badge ${post.status === 'published' ? 'confirmed' : 'warning'}">
                    ${post.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                </span>
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
    const categoryFilter = document.getElementById('blogCategoryFilter');
    const statusFilter = document.getElementById('blogStatusFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            loadBlogPosts({ category: this.value, page: 1 });
        });
    }

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
    const searchInput = document.getElementById('blogSearchInput');
    
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
 * Setup image preview
 */
function setupImagePreview() {
    const input = document.getElementById('blogImage');
    const preview = document.getElementById('blogImagePreview');

    if (!input || !preview) return;

    input.addEventListener('change', function() {
        const file = this.files && this.files[0];
        if (!file) {
            preview.style.display = 'none';
            preview.innerHTML = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 8px;">`;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
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

/**
 * Modal handling
 */
function openBlogModal(postId = null) {
    const modal = document.getElementById('blogModal');
    const title = document.getElementById('blogModalTitle');
    const removeImageWrap = document.getElementById('blogRemoveImageWrap');

    resetBlogForm();

    if (postId) {
        title.textContent = 'Chỉnh sửa bài viết';
        if (removeImageWrap) removeImageWrap.style.display = 'block';
        loadBlogDetail(postId);
    } else {
        title.textContent = 'Thêm bài viết';
        if (removeImageWrap) removeImageWrap.style.display = 'none';
    }

    if (modal) modal.style.display = 'flex';
}

function closeBlogModal() {
    const modal = document.getElementById('blogModal');
    if (modal) modal.style.display = 'none';
    resetBlogForm();
}

function resetBlogForm() {
    const form = document.getElementById('blogForm');
    if (form) form.reset();
    const blogId = document.getElementById('blogId');
    if (blogId) blogId.value = '';
    const preview = document.getElementById('blogImagePreview');
    if (preview) {
        preview.style.display = 'none';
        preview.innerHTML = '';
    }
    const removeImage = document.getElementById('blogRemoveImage');
    if (removeImage) removeImage.checked = false;
}

async function loadBlogDetail(id) {
    try {
        const response = await fetch(`/api/admin/blog/detail.php?id=${id}`, { credentials: 'same-origin' });
        const result = await response.json();
        if (!result.success) {
            showNotification('Không thể tải chi tiết bài viết: ' + result.message, 'error');
            return;
        }

        const post = result.data.post;
        document.getElementById('blogId').value = post.id;
        document.getElementById('blogTitle').value = post.title || '';
        document.getElementById('blogSlug').value = post.slug || '';
        document.getElementById('blogCategory').value = post.category || '';
        document.getElementById('blogStatus').value = post.status || 'draft';
        document.getElementById('blogExcerpt').value = post.excerpt || '';
        document.getElementById('blogContent').value = post.content || '';

        if (post.image_url) {
            const preview = document.getElementById('blogImagePreview');
            preview.innerHTML = `<img src="${post.image_url}" alt="${post.title}" style="max-width: 100%; border-radius: 8px;">`;
            preview.style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load blog detail:', error);
        showNotification('Không thể tải chi tiết bài viết', 'error');
    }
}

async function submitBlogForm() {
    const formData = new FormData();
    const id = document.getElementById('blogId').value;
    const title = document.getElementById('blogTitle').value.trim();
    const slug = document.getElementById('blogSlug').value.trim();
    const category = document.getElementById('blogCategory').value;
    const status = document.getElementById('blogStatus').value;
    const excerpt = document.getElementById('blogExcerpt').value.trim();
    const content = document.getElementById('blogContent').value.trim();
    const imageFile = document.getElementById('blogImage').files[0];
    const removeImage = document.getElementById('blogRemoveImage').checked;

    if (!title || !content || !category) {
        showNotification('Vui lòng nhập đủ tiêu đề, danh mục và nội dung', 'error');
        return;
    }

    if (id) formData.append('id', id);
    formData.append('title', title);
    if (slug) formData.append('slug', slug);
    formData.append('category', category);
    formData.append('status', status);
    if (excerpt) formData.append('excerpt', excerpt);
    formData.append('content', content);
    if (imageFile) formData.append('image', imageFile);
    if (removeImage) formData.append('remove_image', '1');

    const endpoint = id ? '/api/admin/blog/update.php' : '/api/admin/blog/create.php';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const result = await response.json();
        if (result.success) {
            showNotification(id ? 'Cập nhật bài viết thành công' : 'Tạo bài viết thành công', 'success');
            closeBlogModal();
            loadBlogPosts({ page: 1 });
        } else {
            showNotification('Không thể lưu bài viết: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Failed to submit blog form:', error);
        showNotification('Không thể lưu bài viết', 'error');
    }
}

// Placeholder functions
function editBlogPost(id) {
    openBlogModal(id);
}

function deleteBlogPost(id) {
    if (confirm('Bạn có chắc muốn xóa bài viết này?')) {
        fetch('/api/admin/blog/delete.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ id }),
            credentials: 'same-origin'
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                showNotification('Đã xóa bài viết', 'success');
                loadBlogPosts({ page: 1 });
            } else {
                showNotification('Không thể xóa bài viết: ' + result.message, 'error');
            }
        })
        .catch(error => {
            console.error('Failed to delete blog post:', error);
            showNotification('Không thể xóa bài viết', 'error');
        });
    }
}

// Make functions global
window.loadBlogPosts = loadBlogPosts;
window.editBlogPost = editBlogPost;
window.deleteBlogPost = deleteBlogPost;
window.openBlogModal = openBlogModal;
window.closeBlogModal = closeBlogModal;
window.submitBlogForm = submitBlogForm;

function formatCategory(category) {
    const labels = {
        'huong-dan': 'Hướng dẫn chọn hoa',
        'huong-dan-banh': 'Hướng dẫn chọn bánh',
        'tin-tuc': 'Tin tức',
        'khuyen-mai': 'Khuyến mãi'
    };
    return labels[category] || (category || 'N/A');
}
