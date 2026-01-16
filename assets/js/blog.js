/**
 * Blog Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    loadBlogList();
});

async function loadBlogList(page = 1) {
    const grid = document.getElementById('blog-posts-grid');
    const pagination = document.getElementById('blog-pagination');

    if (!grid) return;

    // Show loading skeleton or spinner
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Đang tải bài viết...</div>';

    try {
        // Fetch from API (adjust path if needed)
        const response = await fetch(`../api/blog/list.php?page=${page}&limit=6`);
        const result = await response.json();

        if (result.success) {
            renderBlogPosts(result.data);
            renderPagination(result.pagination);
        } else {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Không tải được bài viết.</div>';
        }
    } catch (error) {
        console.error('Lỗi tải blog:', error);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Đã có lỗi xảy ra. Vui lòng thử lại.</div>';
    }
}

function renderBlogPosts(posts) {
    const grid = document.getElementById('blog-posts-grid');
    if (!grid) return;

    if (posts.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Chưa có bài viết nào.</div>';
        return;
    }

    grid.innerHTML = posts.map(post => `
        <article class="product-card">
            <div class="product-image" style="height: 200px; overflow: hidden;">
                <img src="${post.image}" alt="${post.title}" 
                     style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s;">
            </div>
            <div class="product-info">
                <div class="product-category">${post.category || 'Tin tức'}</div>
                <div class="product-name" style="font-size: 1.1rem; margin: 0.5rem 0;">
                    <a href="blog-detail.html?slug=${post.slug}" style="color: inherit; text-decoration: none;">
                        ${post.title}
                    </a>
                </div>
                <div class="product-description" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${post.excerpt || ''}
                </div>
                <div style="color: var(--text-gray); font-size: 0.85rem; margin-top: 1rem; display: flex; justify-content: space-between;">
                    <span>📅 ${formatDate(post.created_at)}</span>
                    <span>👁️ ${post.views}</span>
                </div>
                <a href="blog-detail.html?slug=${post.slug}" class="add-to-cart-btn" style="margin-top: 1rem; display: block; text-decoration: none; text-align: center;">
                    Đọc thêm
                </a>
            </div>
        </article>
    `).join('');

    // Simple hover effect for images
    grid.querySelectorAll('.product-card').forEach(card => {
        const img = card.querySelector('img');
        card.addEventListener('mouseenter', () => img.style.transform = 'scale(1.1)');
        card.addEventListener('mouseleave', () => img.style.transform = 'scale(1)');
    });
}

function renderPagination(pagination) {
    const container = document.getElementById('blog-pagination');
    if (!container || !pagination) return;

    const { current_page, total_pages } = pagination;

    if (total_pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';

    // Prev
    if (current_page > 1) {
        html += `<a href="#" onclick="event.preventDefault(); loadBlogList(${current_page - 1})">← Trước</a>`;
    }

    // Pages
    for (let i = 1; i <= total_pages; i++) {
        if (i === current_page) {
            html += `<span class="active">${i}</span>`;
        } else {
            html += `<a href="#" onclick="event.preventDefault(); loadBlogList(${i})">${i}</a>`;
        }
    }

    // Next
    if (current_page < total_pages) {
        html += `<a href="#" onclick="event.preventDefault(); loadBlogList(${current_page + 1})">Sau →</a>`;
    }

    container.innerHTML = html;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}
