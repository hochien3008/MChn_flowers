/**
 * Product Detail Page Logic & Interactions
 */

document.addEventListener('DOMContentLoaded', async function () {
    // 1. Get product from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productSlug = urlParams.get('slug');

    // 2. Initialize Interactions
    initInteractions();

    if (!productId && !productSlug) {
        console.warn('No product ID or slug found in URL.');
        return;
    }

    // 3. Load Data
    await loadProductDetail(productId, productSlug);
});

async function loadProductDetail(id, slug) {
    if (!window.API) {
        console.error('API client not found');
        return;
    }

    try {
        const result = await window.API.products.detail(id, slug);
        const product = result.product;

        if (product) {
            populateProductData(product);
            if (product.related_products) {
                renderRelatedProducts(product.related_products);
            }
        }
    } catch (error) {
        console.error('Failed to load product:', error);
    }
}

function populateProductData(product) {
    // 1. Update Title & Meta
    document.title = `${product.name} - Sweetie Garden`;
    setText('.product-title', product.name);
    setText('.breadcrumbs span:last-child', product.name);

    // 2. Update Price
    const priceContainer = document.querySelector('.price-container');
    if (priceContainer) {
        if (product.sale_price) {
            priceContainer.innerHTML = `
                <span class="current-price">${formatPrice(product.sale_price)}</span>
                <span class="original-price">${formatPrice(product.price)}</span>
                <span class="discount-tag">-${product.discount_percent}%</span>
            `;
        } else {
            priceContainer.innerHTML = `
                <span class="current-price">${formatPrice(product.price)}</span>
            `;
        }
    }

    // 3. Update Text Content
    setText('.rating .rating-text', `(${product.reviews_count || 24} đánh giá)`);
    setText('.description-summary', product.short_description || product.description || '');

    // 4. Update Images
    const mainImg = document.getElementById('mainImage');
    if (mainImg) {
        // Set default/fallback handler
        mainImg.onerror = function() {
            this.onerror = null; // Prevent loop
            this.src = '../assets/images/logo.png';
            this.style.objectFit = 'contain'; // Logo might need different fitting
            this.style.padding = '20px';
            this.style.backgroundColor = '#f8f9fa';
        };

        if (product.image_url) {
            mainImg.src = product.image_url;
        } else {
             // Explicitly set fallback if no URL provided
            mainImg.src = '../assets/images/logo.png';
        }
        mainImg.alt = product.name;
    }

    // Gallery removed

    // 5. Update Tab Content (Description)
    const descTab = document.getElementById('description');
    if (descTab) {
        descTab.innerHTML = `
            <h3 style="margin-bottom: 1rem;">Mô tả sản phẩm</h3>
            <div style="color: var(--text-gray); line-height: 1.8;">
                ${product.description || '<p>Đang cập nhật...</p>'}
            </div>
        `;
    }

    // 6. Setup Buttons (Add to Cart)
    setupActionButtons(product);
}

function setupActionButtons(product) {
    const addBtn = document.querySelector('.btn-add-cart');
    if (addBtn) {
        addBtn.onclick = () => addToCart(product, false);
    }

    const buyBtn = document.querySelector('.btn-buy-now');
    if (buyBtn) {
        buyBtn.onclick = () => addToCart(product, true);
    }


}

// renderGallery removed

function renderRelatedProducts(products) {
    const grid = document.querySelector('.products-grid');
    if (!grid || !products.length) return;

    grid.innerHTML = products.map(p => `
        <a href="product-detail.html?slug=${p.slug}" class="product-card">
            <div class="product-image" style="background-image: url('${p.image_url || ''}')"></div>
            <div class="product-info">
                <div class="product-category">${p.category_name || 'Sản phẩm'}</div>
                <div class="product-name">${p.name}</div>
                <div class="product-footer">
                    <div class="product-price">${formatPrice(p.sale_price || p.price)}</div>
                    <button class="add-to-cart-btn" onclick="event.preventDefault(); addToCart(${p.id})">Thêm</button>
                </div>
            </div>
        </a>
    `).join('');
}

/* --- Interactions --- */

function initInteractions() {
    const qtyInput = document.getElementById('qtyInput');
    if (qtyInput) {
        qtyInput.addEventListener('change', (e) => {
            if (e.target.value < 1) e.target.value = 1;
        });
    }
}

function changeImage(src) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.style.opacity = '0.5';
        mainImage.src = src;
        setTimeout(() => mainImage.style.opacity = '1', 200);
    }

    document.querySelectorAll('.thumbnail').forEach(t => {
        t.classList.toggle('active', t.querySelector('img').src === src);
    });
}

function updateQty(change) {
    const qtyInput = document.getElementById('qtyInput');
    if (qtyInput) {
        let val = parseInt(qtyInput.value) + change;
        if (val < 1) val = 1;
        qtyInput.value = val;
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const content = document.getElementById(tabId);
    if (content) content.classList.add('active');

    // Activate button by checking onclick content
    const btns = document.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}

function addToCart(product, redirect = false) {
    const qtyInput = document.getElementById('qtyInput');
    const quantity = qtyInput ? parseInt(qtyInput.value) : 1;

    if (window.cartManager) {
        window.cartManager.add(product, quantity);
        if (redirect) {
            window.location.href = 'cart.html';
        }
    } else {
        console.error('CartManager not loaded');
    }
}

/* --- Helpers --- */

function setText(selector, text) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}
