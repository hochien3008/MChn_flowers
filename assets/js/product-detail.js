/**
 * Product Detail Page Logic
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Get product from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productSlug = urlParams.get('slug');

    if (!productId && !productSlug) {
        showError('Không tìm thấy sản phẩm');
        return;
    }

    // Load product detail
    await loadProductDetail(productId, productSlug);

    // Setup quantity controls
    setupQuantityControls();

    // Setup add to cart
    setupAddToCart();
});

/**
 * Load product detail
 */
async function loadProductDetail(id, slug) {
    if (!window.API) {
        showError('API chưa được tải');
        return;
    }

    try {
        const result = await window.API.products.detail(id, slug);
        const product = result.product;

        // Render product detail
        renderProductDetail(product);

        // Render related products
        if (product.related_products && product.related_products.length > 0) {
            renderRelatedProducts(product.related_products);
        }

    } catch (error) {
        console.error('Failed to load product:', error);
        showError('Không thể tải thông tin sản phẩm');
    }
}

/**
 * Render product detail
 */
function renderProductDetail(product) {
    // Update page title
    document.title = `${product.name} - Sweetie Garden`;

    // Product name
    const nameElement = document.querySelector('.product-name, h1');
    if (nameElement) {
        nameElement.textContent = product.name;
    }

    // Product image
    const imageElement = document.querySelector('.product-image img, .product-main-image img');
    if (imageElement && product.image_url) {
        imageElement.src = product.image_url;
        imageElement.alt = product.name;
    }

    // Product price
    const priceContainer = document.querySelector('.product-price, .price-container');
    if (priceContainer) {
        if (product.sale_price) {
            priceContainer.innerHTML = `
                <span class="sale-price">${formatPrice(product.sale_price)}</span>
                <span class="old-price">${formatPrice(product.price)}</span>
                <span class="discount-badge">-${product.discount_percent}%</span>
            `;
        } else {
            priceContainer.innerHTML = `<span class="price">${formatPrice(product.price)}</span>`;
        }
    }

    // Product description
    const descElement = document.querySelector('.product-description, .description');
    if (descElement && product.description) {
        descElement.innerHTML = product.description;
    }

    // Short description
    const shortDescElement = document.querySelector('.product-short-description, .short-description');
    if (shortDescElement && product.short_description) {
        shortDescElement.textContent = product.short_description;
    }

    // Stock status
    const stockElement = document.querySelector('.stock-status, .availability');
    if (stockElement) {
        if (product.stock > 0) {
            stockElement.innerHTML = `<span class="in-stock">Còn ${product.stock} sản phẩm</span>`;
        } else {
            stockElement.innerHTML = '<span class="out-of-stock">Hết hàng</span>';
        }
    }

    // Category
    const categoryElement = document.querySelector('.product-category');
    if (categoryElement && product.category_name) {
        categoryElement.innerHTML = `
            <a href="../shop/products.html?category=${product.category_slug}">${product.category_name}</a>
        `;
    }

    // SKU
    const skuElement = document.querySelector('.product-sku');
    if (skuElement && product.sku) {
        skuElement.textContent = product.sku;
    }

    // Store product ID for add to cart
    const addToCartBtn = document.querySelector('.add-to-cart-btn, [data-add-to-cart]');
    if (addToCartBtn) {
        addToCartBtn.dataset.productId = product.id;
        
        // Disable if out of stock
        if (product.stock <= 0) {
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Hết hàng';
        }
    }

    // Gallery (if exists)
    if (product.gallery && product.gallery.length > 0) {
        renderGallery(product.gallery);
    }
}

/**
 * Render related products
 */
function renderRelatedProducts(products) {
    const container = document.querySelector('.related-products-grid, .related-products');
    
    if (!container) return;

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <a href="product-detail.html?slug=${product.slug}">
                <div class="product-image">
                    ${product.image_url 
                        ? `<img src="${product.image_url}" alt="${product.name}">`
                        : '<div style="width: 100%; height: 200px; background: #f0f0f0;">🎂</div>'
                    }
                </div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    ${product.sale_price 
                        ? `<span class="sale-price">${formatPrice(product.sale_price)}</span>
                           <span class="old-price">${formatPrice(product.price)}</span>`
                        : `<span>${formatPrice(product.price)}</span>`
                    }
                </div>
            </a>
        </div>
    `).join('');
}

/**
 * Setup quantity controls
 */
function setupQuantityControls() {
    const decreaseBtn = document.querySelector('.quantity-decrease, .qty-decrease');
    const increaseBtn = document.querySelector('.quantity-increase, .qty-increase');
    const quantityInput = document.querySelector('.quantity-input, input[name="quantity"]');

    if (!quantityInput) return;

    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            let value = parseInt(quantityInput.value) || 1;
            quantityInput.value = Math.max(1, value - 1);
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            let value = parseInt(quantityInput.value) || 1;
            const max = parseInt(quantityInput.max) || 999;
            quantityInput.value = Math.min(max, value + 1);
        });
    }
}

/**
 * Setup add to cart
 */
function setupAddToCart() {
    const addToCartBtn = document.querySelector('.add-to-cart-btn, [data-add-to-cart]');
    const quantityInput = document.querySelector('.quantity-input, input[name="quantity"]');

    if (!addToCartBtn) return;

    addToCartBtn.addEventListener('click', async function() {
        const productId = this.dataset.productId;
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        if (!productId || !window.API) return;

        try {
            const originalText = this.textContent;
            this.disabled = true;
            this.textContent = 'Đang thêm...';

            await window.API.cart.add(parseInt(productId), quantity);
            
            window.API.showNotification('Đã thêm vào giỏ hàng!', 'success');
            await window.API.cart.updateBadge();

            this.disabled = false;
            this.textContent = originalText;

            // Reset quantity
            if (quantityInput) {
                quantityInput.value = 1;
            }

        } catch (error) {
            window.API.showNotification(error.message || 'Thêm vào giỏ hàng thất bại', 'error');
            this.disabled = false;
            this.textContent = 'Thêm vào giỏ';
        }
    });
}

/**
 * Render gallery
 */
function renderGallery(images) {
    const galleryContainer = document.querySelector('.product-gallery, .image-gallery');
    
    if (!galleryContainer) return;

    galleryContainer.innerHTML = images.map(imageUrl => `
        <div class="gallery-item">
            <img src="${imageUrl}" alt="Product Image">
        </div>
    `).join('');

    // Add click to view full image
    galleryContainer.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', function() {
            const mainImage = document.querySelector('.product-main-image img, .product-image img');
            if (mainImage) {
                mainImage.src = this.src;
            }
        });
    });
}

/**
 * Show error
 */
function showError(message) {
    const container = document.querySelector('.product-detail-container, .product-content');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <p style="color: #ef4444; font-size: 1.2rem;">${message}</p>
                <a href="../shop/products.html" class="btn-primary" style="margin-top: 1rem;">
                    Quay lại trang sản phẩm
                </a>
            </div>
        `;
    }
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

