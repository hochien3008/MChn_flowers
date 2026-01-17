// ============================================
// Load API Client
// ============================================
// API client will be loaded via script tag in HTML

// Sticky Header on Scroll
window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        header?.classList.add('scrolled');
        nav?.classList.add('scrolled');
    } else {
        header?.classList.remove('scrolled');
        nav?.classList.remove('scrolled');
    }
});

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function () {
            this.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
    }

    // Dropdown Menu for Mobile
    const dropdownItems = document.querySelectorAll('.nav-links li.has-dropdown');
    dropdownItems.forEach(item => {
        // Get the direct child <a> tag (not from dropdown menu)
        const link = item.firstElementChild;
        if (link && link.tagName === 'A') {
            link.addEventListener('click', function (e) {
                // Only prevent default on mobile to toggle dropdown
                // On desktop, allow normal navigation to the category page
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    item.classList.toggle('active');
                }
                // On desktop (> 768px), the link will navigate normally
            });
        }
    });

    // Ensure all non-dropdown links work properly (Combo, Quà tặng, Blog, So sánh)
    const allNavLinks = document.querySelectorAll('.nav-links > li:not(.has-dropdown) > a');
    allNavLinks.forEach(link => {
        // These links should always navigate normally
        link.addEventListener('click', function (e) {
            // No preventDefault - allow normal navigation
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (e) {
        if (window.innerWidth <= 768) {
            if (navLinks && mobileMenuToggle) {
                if (!navLinks.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    navLinks.classList.remove('active');
                    mobileMenuToggle.classList.remove('active');
                }
            }
        }
    });

    // Close mobile menu when clicking on a link
    if (navLinks) {
        const navLinksItems = navLinks.querySelectorAll('a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    if (mobileMenuToggle) {
                        mobileMenuToggle.classList.remove('active');
                    }
                }
            });
        });
    }

    // Notification Bell Toggle
    const notificationBell = document.querySelector('.notification-bell');
    const notificationDropdown = document.querySelector('.notification-dropdown');

    if (notificationBell && notificationDropdown) {
        notificationBell.addEventListener('click', function (e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
        });

        // Close notification dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!notificationBell.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });
    }

    // Occasion tags selection
    const occasionTags = document.querySelectorAll('.occasion-tag');
    occasionTags.forEach(tag => {
        tag.addEventListener('click', function () {
            occasionTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Homepage Product Controls (Filters & Sort)
    const filterPills = document.querySelectorAll('.filter-pill');
    // const occasionSelect & sortSelect removed - access dynamically in applyFilters

    // Handle Category Pills
    filterPills.forEach(pill => {
        pill.addEventListener('click', function () {
            // Update active state
            filterPills.forEach(p => p.classList.remove('active'));
            this.classList.add('active');

            // Trigger filter update
            applyFilters();
        });
    });

    // Handle Dropdowns (Occasion & Sort)
    const selects = document.querySelectorAll('.product-controls .custom-select');
    selects.forEach(select => {
        select.addEventListener('change', function () {
            applyFilters();
        });
    });

    function applyFilters() {
        // Collect current filter values
        const activeCategoryBtn = document.querySelector('.filter-pill.active');
        const categoryMap = {
            'Tất cả': '',
            'Bánh kem': 'banh-kem',
            'Hoa tươi': 'hoa-tuoi',
            'Combo': 'combo',
            'Quà tặng': 'qua-tang'
        };
        const category = activeCategoryBtn ? categoryMap[activeCategoryBtn.textContent.trim()] : '';

        // Get occasion and sort values
        let occasion = '';
        let sort = 'newest';

        // Identify which select is which based on content (simple heuristic)
        // In the HTML: 1st is Occasion, 2nd is Sort
        const controls = document.querySelectorAll('.product-controls .custom-select');
        if (controls.length >= 2) {
            occasion = controls[0].value;
            sort = controls[1].value;
        }

        console.log('Applying filters:', { category, occasion, sort });

        // Call API to reload products
        // We will reload both grids with the same filters for now, 
        // or we could unify them. Let's redirect to a unified "search/filter result" approach
        // if filters are active, or just reload the grids.

        // For smoother UX, let's reload the grids:
        reloadProductGrids({ category, occasion, sort });
    }

    async function reloadProductGrids(filters = {}) {
        const featuredGrid = document.getElementById('featuredProductsGrid');
        const newGrid = document.getElementById('newProductsGrid');

        // Show loading state
        if (featuredGrid) featuredGrid.innerHTML = '<div class="loading-spinner"></div>';
        if (newGrid) newGrid.innerHTML = '<div class="loading-spinner"></div>';

        try {
            // Build API params
            const params = { limit: 10, ...filters }; // Increase limit as per user request to see more

            // If we are filtering, the concept of "Featured" vs "New" might blur
            // Let's just load results into the first grid and hide the second section title if needed
            // But for simplicity, let's keep loading data into both but with the filter applied.

            if (window.API && window.API.products) {
                // Fetch data
                const data = await window.API.products.list(params);

                if (featuredGrid) {
                    renderHomeProducts(featuredGrid, data.products || []);
                }

                // For the second grid, maybe load "Best Sellers" with same filters?
                // Or just duplicate for now as a placeholder if we don't have separate endpoints
                // Let's try to load "price-asc" for the second one if the first was "newest"
                // checking current sort...

                if (newGrid) {
                    // If user selected a specific sort, apply it to both? 
                    // Or keep the second grid as "suggestions".
                    // Let's just mirror for now to ensure feedback, or leave New Grid as is?
                    // If I filter by "Birthday", both grids should probably show Birthday items.

                    const data2 = await window.API.products.list({ ...params, sort: 'popular' });
                    renderHomeProducts(newGrid, data2.products || []);
                }
            }
        } catch (error) {
            console.error('Filter error:', error);
            if (featuredGrid) featuredGrid.innerHTML = 'Không tìm thấy sản phẩm phù hợp';
            if (newGrid) newGrid.innerHTML = '';
        }
    }

    // Chatbot Toggle
    const chatbotBtn = document.querySelector('.chatbot-btn');
    const chatbotWindow = document.querySelector('.chatbot-window');

    if (chatbotBtn && chatbotWindow) {
        chatbotBtn.addEventListener('click', function () {
            chatbotWindow.classList.toggle('active');
        });

        // Close chatbot when clicking outside
        document.addEventListener('click', function (e) {
            if (!chatbotBtn.contains(e.target) && !chatbotWindow.contains(e.target)) {
                chatbotWindow.classList.remove('active');
            }
        });
    }

    // ============================================
    // Homepage Products
    // ============================================
    loadHomepageProducts();

    // ============================================
    // Authentication Forms
    // ============================================

    // Login Form
    const loginForm = document.querySelector('.auth-form');
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!window.API) {
                alert('API chưa được tải. Vui lòng thử lại.');
                return;
            }

            const email = this.querySelector('input[type="email"]')?.value.trim();
            const password = this.querySelector('input[type="password"]')?.value;

            if (!email || !password) {
                window.API.showNotification('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            try {
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang đăng nhập...';

                await window.API.auth.login(email, password);

                window.API.showNotification('Đăng nhập thành công!', 'success');

                // Redirect
                setTimeout(() => {
                    const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '../index.html';
                    window.location.href = redirectUrl;
                }, 1000);

            } catch (error) {
                window.API.showNotification(error.message || 'Đăng nhập thất bại', 'error');
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Đăng nhập';
            }
        });
    }

    // Register Form
    if (loginForm && window.location.pathname.includes('register.html')) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!window.API) {
                alert('API chưa được tải. Vui lòng thử lại.');
                return;
            }

            const email = this.querySelector('input[type="email"]')?.value.trim();
            const password = this.querySelector('input[type="password"]')?.value;
            const fullName = this.querySelector('input[name="full_name"]')?.value.trim() ||
                this.querySelector('input[placeholder*="Họ tên"]')?.value.trim();

            if (!email || !password || !fullName) {
                window.API.showNotification('Vui lòng điền đầy đủ thông tin', 'error');
                return;
            }

            if (password.length < 6) {
                window.API.showNotification('Mật khẩu phải có ít nhất 6 ký tự', 'error');
                return;
            }

            try {
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Đang đăng ký...';

                await window.API.auth.register(email, password, fullName);

                window.API.showNotification('Đăng ký thành công!', 'success');

                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);

            } catch (error) {
                window.API.showNotification(error.message || 'Đăng ký thất bại', 'error');
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Đăng ký';
            }
        });
    }

    // ============================================
    // Cart Functions
    // ============================================

    // Add to Cart buttons
    document.addEventListener('click', async function (e) {
        const addToCartBtn = e.target.closest('.add-to-cart, [data-add-to-cart]');
        if (addToCartBtn && window.API) {
            e.preventDefault();
            e.stopPropagation(); // Stop bubbling to product card

            const productId = addToCartBtn.dataset.productId || addToCartBtn.dataset.addToCart;
            if (!productId) return;

            try {
                const originalText = addToCartBtn.textContent;
                addToCartBtn.disabled = true;
                addToCartBtn.textContent = 'Đang thêm...';

                await window.API.cart.add(parseInt(productId), 1);

                window.API.showNotification('Đã thêm vào giỏ hàng!', 'success');
                await window.API.cart.updateBadge();

                addToCartBtn.disabled = false;
                addToCartBtn.textContent = originalText;
            } catch (error) {
                window.API.showNotification(error.message || 'Thêm vào giỏ hàng thất bại', 'error');
                addToCartBtn.disabled = false;
                addToCartBtn.textContent = originalText;
            }
        }
    });
});

async function loadHomepageProducts() {
    const featuredGrid = document.getElementById('featuredProductsGrid');
    const newGrid = document.getElementById('newProductsGrid');

    if (!featuredGrid && !newGrid) return;
    if (!window.API || !window.API.products) return;

    const featuredPromise = window.API.products.list({ limit: 6, sort: 'popular' });
    const newPromise = window.API.products.list({ limit: 6, sort: 'newest' });

    try {
        const [featuredData, newData] = await Promise.all([featuredPromise, newPromise]);
        if (featuredGrid) {
            renderHomeProducts(featuredGrid, featuredData.products || []);
        }
        if (newGrid) {
            renderHomeProducts(newGrid, newData.products || []);
        }
    } catch (error) {
        console.error('Failed to load homepage products:', error);
        if (featuredGrid) {
            featuredGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-gray);">Không thể tải sản phẩm nổi bật.</div>`;
        }
        if (newGrid) {
            newGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-gray);">Không thể tải sản phẩm mới.</div>`;
        }
    }
}

// Initialize Global Product Registry
window.productRegistry = window.productRegistry || {};

function renderHomeProducts(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-gray);">Chưa có sản phẩm.</div>`;
        return;
    }

    container.innerHTML = products.map(product => {
        // Store in registry
        window.productRegistry[product.id] = product;

        const categoryLabel = product.category_name || 'Sản phẩm';
        const description = product.short_description || product.description || '';
        const trimmedDescription = description.length > 90 ? `${description.slice(0, 90)}...` : description;
        const detailUrl = `shop/product-detail.html?slug=${encodeURIComponent(product.slug || '')}`;
        const hasDiscount = product.discount_percent > 0;
        const badges = [];

        if (hasDiscount) {
            badges.push(`<span class="badge badge-sale">Giảm ${product.discount_percent}%</span>`);
        }

        if (product.featured) {
            badges.push(`<span class="badge badge-hot">HOT</span>`);
        }

        const imageMarkup = product.image_url
            ? `<div class="product-image" style="background-image: url('${product.image_url}'); background-size: cover; background-position: center;"></div>`
            : `<div class="product-image">${getCategoryEmoji(product.category_slug)}</div>`;

        return `
            <div class="product-card" data-detail-url="${detailUrl}" style="position: relative;">
                ${badges.length ? `<div class="product-badge-container">${badges.join('')}</div>` : ''}
                <div class="product-actions">
                    <button class="action-btn" type="button" title="Yêu thích" data-href="pages/wishlist.html">🤍</button>
                    <button class="action-btn share" type="button" title="Chia sẻ" data-share-url="${detailUrl}">📤</button>
                    <button class="action-btn compare" type="button" title="So sánh" onclick="window.compareManager && window.compareManager.add(window.productRegistry[${product.id}])">⚖️</button>
                </div>
                <div class="product-card-inner">
                    ${imageMarkup}
                    <div class="product-info">
                        <div class="product-category">${categoryLabel}</div>
                        <div class="product-name">${product.name || 'Sản phẩm'}</div>
                        <div class="rating">
                            <div class="stars">
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                                <span class="star">⭐</span>
                            </div>
                            <span class="rating-text">(${product.sales_count || 0} đã bán)</span>
                        </div>
                        <div class="product-description">${trimmedDescription}</div>
                        <div class="product-footer">
                            <div class="product-price">
                                ${formatPrice(product.final_price || product.price)}
                                ${hasDiscount ? `<span class="old-price">${formatPrice(product.price)}</span>` : ''}
                            </div>
                            <button class="add-to-cart-btn" type="button" data-add-to-cart="${product.id}">Thêm vào giỏ</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatPrice(price) {
    if (price === null || price === undefined) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
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

document.addEventListener('click', async function (event) {
    const actionBtn = event.target.closest('.product-actions .action-btn');
    if (actionBtn) {
        event.preventDefault();
        event.stopPropagation();

        if (actionBtn.classList.contains('share')) {
            const url = actionBtn.getAttribute('data-share-url') || window.location.href;
            const title = 'Sweetie Garden';

            if (navigator.share) {
                try {
                    await navigator.share({ title, url });
                } catch (error) {
                    console.warn('Share canceled or failed:', error);
                }
                return;
            }

            try {
                await navigator.clipboard.writeText(url);
                showNotification('Đã sao chép link chia sẻ', 'success');
            } catch (error) {
                console.error('Failed to copy share URL:', error);
                showNotification('Không thể chia sẻ liên kết', 'error');
            }
            return;
        }

        const href = actionBtn.getAttribute('data-href');
        if (href) {
            window.location.href = href;
        }
        return;
    }

    const card = event.target.closest('.product-card[data-detail-url]');
    if (card) {
        const url = card.getAttribute('data-detail-url');
        if (url) {
            window.location.href = url;
        }
    }
});

// ============================================
// Advanced Loading Screen
// ============================================
(function () {
    const loadingScreen = document.getElementById('loading-screen');

    window.addEventListener('load', function () {
        if (loadingScreen) {
            // Minimum display time 2.5 giây để animation chạy đẹp
            setTimeout(function () {
                // Fade out
                loadingScreen.classList.add('fade-out');

                // Remove khỏi DOM sau khi fade out
                setTimeout(function () {
                    loadingScreen.style.display = 'none';
                }, 800);
            }, 2500);
        }
    });
})();

// ============================================
// Helper Functions
// ============================================

// Format price helper
function formatPrice(price) {
    if (!price) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Load cart function
async function loadCart() {
    if (!window.API) return;

    try {
        const cartData = await window.API.cart.get();
        const cartContainer = document.querySelector('.cart-items, .cart-container');

        if (!cartContainer) return;

        if (cartData.items.length === 0) {
            cartContainer.innerHTML = '<div style="text-align: center; padding: 2rem;">Giỏ hàng trống</div>';
            return;
        }

        // This is a simplified version - you'll need to customize based on your HTML structure
        console.log('Cart data:', cartData);

        // Update cart badge
        await window.API.cart.updateBadge();
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}
