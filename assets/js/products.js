/**
 * Products Page Logic
 */

document.addEventListener('DOMContentLoaded', async function () {
    // URL Params initial load
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const search = urlParams.get('search');
    const page = parseInt(urlParams.get('page')) || 1;
    const sort = urlParams.get('sort') || 'newest';

    // Set initial values to Sidebar inputs if present in URL
    if (category) {
        const categoryInput = document.querySelector(`input[name="category"][value="${category}"]`);
        if (categoryInput) categoryInput.checked = true;
    }

    // Initial Load
    await loadProducts(collectSidebarFilters());

    // Sidebar Category Radio Change
    const categoryInputs = document.querySelectorAll('input[name="category"]');
    categoryInputs.forEach(input => {
        input.addEventListener('change', () => {
            refreshProducts();
        });
    });

    // Sidebar Occasion Checkbox Change
    const occasionInputs = document.querySelectorAll('input[name="occasion"]');
    occasionInputs.forEach(input => {
        input.addEventListener('change', () => {
            refreshProducts();
        });
    });

    // Price Filter Apply
    const applyPriceBtn = document.getElementById('applyPriceFilter');
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', refreshProducts);
    }

    // Sort Select Change
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.value = sort; // Set initial value
        sortSelect.addEventListener('change', refreshProducts);
    }

    // Mobile Sidebar Toggle
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebarFilters = document.getElementById('sidebarFilters');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');

    if (toggleSidebarBtn && sidebarFilters) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebarFilters.classList.add('active');
            if (closeSidebarBtn) closeSidebarBtn.style.display = 'block';
        });

        // Close when clicking outside on mobile (if we add overlay logic later) 
        // OR separate close button
    }

    if (closeSidebarBtn && sidebarFilters) {
        closeSidebarBtn.addEventListener('click', () => {
            sidebarFilters.classList.remove('active');
            closeSidebarBtn.style.display = 'none';
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        if (search) searchInput.value = search;
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                refreshProducts();
            }
        });
    }
});

function refreshProducts() {
    const params = collectSidebarFilters();
    loadProducts({ ...params, page: 1 });
}

function collectSidebarFilters() {
    const params = {};

    // Category
    const selectedCategory = document.querySelector('input[name="category"]:checked');
    if (selectedCategory && selectedCategory.value) {
        params.category = selectedCategory.value;
    }

    // Occasions (Multiple)
    const selectedOccasions = Array.from(document.querySelectorAll('input[name="occasion"]:checked'))
        .map(input => input.value);
    if (selectedOccasions.length > 0) {
        params.occasion = selectedOccasions.join(',');
    }

    // Price
    const minPrice = document.getElementById('filterMinPrice')?.value;
    const maxPrice = document.getElementById('filterMaxPrice')?.value;
    if (minPrice) params.min_price = minPrice;
    if (maxPrice) params.max_price = maxPrice;

    // Sort
    const sort = document.getElementById('sortSelect')?.value;
    if (sort) params.sort = sort;

    // Search (Header input)
    const searchInput = document.querySelector('.search-box input');
    if (searchInput && searchInput.value.trim()) {
        params.search = searchInput.value.trim();
    }

    return params;
}

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
    // Update count
    const countEl = document.getElementById('productCount');
    if (countEl) countEl.textContent = products ? products.length : 0;

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
                        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                            <a class="add-to-cart-btn" href="product-detail.html?slug=${product.slug}" style="flex: 1; text-align: center;">Chi tiết</a>
                            <button class="add-to-cart-btn" onclick='window.compareManager.add(${JSON.stringify({
            id: product.id,
            name: product.name,
            price: product.sale_price || product.price,
            image: product.image_url || "",
            slug: product.slug,
            category_id: product.category_slug
        })})' style="padding: 0 0.8rem; background: white; color: var(--accent-color); border: 1px solid var(--accent-color);" title="So sánh">
                                🔄
                            </button>
                        </div>
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
