/**
 * Blog Detail Page Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    const id = urlParams.get('id');

    if (!slug && !id) {
        document.getElementById('blog-content').innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="color: red;">Không tìm thấy bài viết.</p>
                <a href="blog.html">Quay lại danh sách</a>
            </div>
        `;
        return;
    }

    await loadBlogDetail(slug, id);
});

async function loadBlogDetail(slug, id) {
    const container = document.getElementById('blog-content');

    try {
        let url = `../api/blog/detail.php?`;
        if (slug) url += `slug=${slug}`;
        else url += `id=${id}`;

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            renderBlogDetail(result.data);
        } else {
            container.innerHTML = '<p style="text-align:center">Không thể tải bài viết.</p>';
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="text-align:center">Lỗi kết nối.</p>';
    }
}

function renderBlogDetail(post) {
    // Update Title & Breadcrumb
    document.title = `${post.title} - Sweetie Garden`;
    const breadcrumb = document.getElementById('breadcrumb-title');
    if (breadcrumb) breadcrumb.textContent = post.title;

    const container = document.getElementById('blog-content');

    container.innerHTML = `
        <div class="blog-header" style="text-align: center; margin-bottom: 2rem;">
            <div class="blog-category" style="color: var(--accent-color); font-weight: 700; text-transform: uppercase; font-size: 0.9rem; margin-bottom: 0.5rem;">
                ${post.category || 'Tin tức'}
            </div>
            <h1 style="font-size: 2rem; color: var(--text-dark); margin-bottom: 1rem; line-height: 1.3;">
                ${post.title}
            </h1>
            <div class="blog-meta" style="color: var(--text-gray); font-size: 0.9rem;">
                <span>👤 ${post.author_name || 'Admin'}</span>
                <span style="margin: 0 0.5rem;">|</span>
                <span>📅 ${formatDate(post.created_at)}</span>
                <span style="margin: 0 0.5rem;">|</span>
                <span>👁️ ${post.views} lượt xem</span>
            </div>
        </div>

        ${post.image ? `
            <div class="blog-featured-image" style="margin-bottom: 2rem; border-radius: 16px; overflow: hidden; max-height: 500px;">
                <img src="${post.image}" alt="${post.title}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
        ` : ''}

        <div class="blog-body" style="line-height: 1.8; color: var(--text-dark); font-size: 1.05rem;">
            ${post.content}
        </div>

        <div class="blog-footer" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color); text-align: center;">
            <a href="blog.html" class="add-to-cart-btn" style="text-decoration: none; display: inline-block; width: auto; padding: 0.8rem 2rem;">
                ← Quay lại trang Blog
            </a>
        </div>
    `;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
}
