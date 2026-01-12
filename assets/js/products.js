/**
 * Products Page Logic
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');
    const page = parseInt(urlParams.get('page')) || 1;
    const sort = urlParams.get('sort') || 'newest';

    // Load products
    await loadProducts({
        category: category,
        search: search,
        page: page,
        sort: sort
    });

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            this.classList.add('active');
            
            // Get category from button text
            const category = this.textContent.trim().toLowerCase();
            
            // Reload products with filter
            if (category === 'tất cả') {
                loadProducts({ page: 1 });
            } else {
                loadProducts({ 
                    category: getCategorySlug(category),
                    page: 1 
                });
            }
        });
    });

    // Sort select
    const sortSelect = document.querySelector('select[name="sort"]');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            loadProducts({ sort: this.value, page: 1 });
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    loadProducts({ search: searchTerm, page: 1 });
                }
            }
        });
    }

    // Advanced filters apply
    const applyBtn = document.getElementById('applyFiltersBtn');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const params = collectAdvancedFilters();
            loadProducts({ ...params, page: 1 });
        });
    }
});

/**
 * Load products from API
 */
async function loadProducts(params = {}) {
    if (!window.API) {
        console.error('API not loaded');
        return;
    }

    try {
        const result = await window.API.products.list(params);
        
        // Render products
        renderProducts(result.products);
        
        // Render pagination
        renderPagination(result.pagination);
        
    } catch (error) {
        console.error('Failed to load products:', error);
        showProductsError('Không thể tải danh sách sản phẩm. Vui lòng thử lại sau.');
    }
}

/**
 * Render products
 */
function renderProducts(products) {
    const container = document.getElementById('productsGrid') || document.querySelector('.products-grid, .products-container');
    
    if (!container) {
        console.warn('Products container not found');
        return;
    }

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="font-size: 1.2rem; color: #666;">Không tìm thấy sản phẩm nào</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const imageMarkup = product.image_url
            ? `<div class="product-image" style="background-image: url('${product.image_url}'); background-size: cover; background-position: center;"></div>`
            : `<div class="product-image">${getCategoryEmoji(product.category_slug)}</div>`;

        const priceMarkup = product.sale_price
            ? `<div class="product-price">
                    ${formatPrice(product.sale_price)}
                    <span class="old-price">${formatPrice(product.price)}</span>
               </div>`
            : `<div class="product-price">${formatPrice(product.price)}</div>`;

        return `
            <div class="product-card" data-product-id="${product.id}">
                ${imageMarkup}
                <div class="product-info">
                    <div class="product-category">${product.category_name || 'Sản phẩm'}</div>
                    <div class="product-name">${product.name}</div>
                    ${product.short_description ? `<div class="product-description">${product.short_description}</div>` : ''}
                    <div class="product-footer">
                        ${priceMarkup}
                        <a class="add-to-cart-btn" href="product-detail.html?slug=${product.slug}">Xem chi tiết</a>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const container = document.querySelector('.pagination');
    
    if (!container || !pagination) {
        return;
    }

    const { current_page, total_pages, has_prev, has_next } = pagination;

    if (total_pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';

    // Previous button
    if (has_prev) {
        html += `<a href="?page=${current_page - 1}" class="pagination-btn">← Trước</a>`;
    }

    // Page numbers
    for (let i = 1; i <= total_pages; i++) {
        if (i === current_page) {
            html += `<span class="pagination-btn active">${i}</span>`;
        } else if (i === 1 || i === total_pages || Math.abs(i - current_page) <= 2) {
            html += `<a href="?page=${i}" class="pagination-btn">${i}</a>`;
        } else if (i === current_page - 3 || i === current_page + 3) {
            html += `<span class="pagination-dots">...</span>`;
        }
    }

    // Next button
    if (has_next) {
        html += `<a href="?page=${current_page + 1}" class="pagination-btn">Sau →</a>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Show error message
 */
function showProductsError(message) {
    const container = document.querySelector('.products-grid, .products-container');
    if (container) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <p style="color: #ef4444; font-size: 1.1rem;">${message}</p>
            </div>
        `;
    }
}

/**
 * Get category slug from name
 */
function getCategorySlug(name) {
    const mapping = {
        'bánh kem': 'banh-kem',
        'hoa tươi': 'hoa-tuoi',
        'combo': 'combo',
        'quà tặng': 'qua-tang'
    };
    return mapping[name.toLowerCase()] || name;
}

/**
 * Format price helper
 */
function formatPrice(price) {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function collectAdvancedFilters() {
    const category = document.getElementById('filterCategory')?.value || '';
    const minPrice = document.getElementById('filterMinPrice')?.value || '';
    const maxPrice = document.getElementById('filterMaxPrice')?.value || '';
    const sort = document.getElementById('filterSort')?.value || 'newest';

    const params = {};
    if (category) params.category = category;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;
    if (sort) params.sort = sort;

    const occasion = document.getElementById('filterOccasion')?.value || '';
    const size = document.getElementById('filterSize')?.value || '';
    const color = document.getElementById('filterColor')?.value || '';

    if (occasion || size || color) {
        showProductsError('Bộ lọc dịp tặng/kích thước/màu sắc chưa được hỗ trợ trên dữ liệu hiện tại.');
    }

    return params;
}

function getCategoryEmoji(slug) {
    const map = {
        'banh-kem': '🎂',
        'banh-kem-sinh-nhat': '🎂',
        'banh-kem-su-kien': '🎉',
        'banh-kem-theo-chu-de': '✨',
        'hoa-tuoi': '🌸',
        'hoa-bo-hoa-hop': '🌹',
        'hoa-gio': '🧺',
        'hoa-khai-truong': '🎊',
        'combo': '🎁',
        'qua-tang': '🎁'
    };
    return map[slug] || '🌺';
}
