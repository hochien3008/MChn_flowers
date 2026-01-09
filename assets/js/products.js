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
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set('sort', this.value);
            currentParams.set('page', '1'); // Reset to page 1
            window.location.search = currentParams.toString();
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
    const container = document.querySelector('.products-grid, .products-container');
    
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

    container.innerHTML = products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                ${product.image_url 
                    ? `<img src="${product.image_url}" alt="${product.name}">`
                    : '<div style="width: 100%; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center;">🎂</div>'
                }
                ${product.discount_percent > 0 
                    ? `<span class="product-badge">-${product.discount_percent}%</span>`
                    : ''
                }
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                ${product.short_description 
                    ? `<p class="product-description">${product.short_description}</p>`
                    : ''
                }
                <div class="product-price">
                    ${product.sale_price 
                        ? `<span class="sale-price">${formatPrice(product.sale_price)}</span>
                           <span class="old-price">${formatPrice(product.price)}</span>`
                        : `<span class="price">${formatPrice(product.price)}</span>`
                    }
                </div>
                <div class="product-actions">
                    <button class="btn-primary add-to-cart" data-add-to-cart="${product.id}">
                        🛒 Thêm vào giỏ
                    </button>
                    <a href="product-detail.html?slug=${product.slug}" class="btn-secondary">
                        Xem chi tiết
                    </a>
                </div>
            </div>
        </div>
    `).join('');
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

