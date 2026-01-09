// ============================================
// Load API Client
// ============================================
// API client will be loaded via script tag in HTML

// Sticky Header on Scroll
window.addEventListener('scroll', function() {
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
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
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
            link.addEventListener('click', function(e) {
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
        link.addEventListener('click', function(e) {
            // No preventDefault - allow normal navigation
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
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
            link.addEventListener('click', function() {
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
        notificationBell.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationDropdown.classList.toggle('active');
        });

        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationBell.contains(e.target)) {
                notificationDropdown.classList.remove('active');
            }
        });
    }

    // Chatbot Toggle
    const chatbotBtn = document.querySelector('.chatbot-btn');
    const chatbotWindow = document.querySelector('.chatbot-window');
    
    if (chatbotBtn && chatbotWindow) {
        chatbotBtn.addEventListener('click', function() {
            chatbotWindow.classList.toggle('active');
        });

        // Close chatbot when clicking outside
        document.addEventListener('click', function(e) {
            if (!chatbotBtn.contains(e.target) && !chatbotWindow.contains(e.target)) {
                chatbotWindow.classList.remove('active');
            }
        });
    }

    // ============================================
    // Authentication Forms
    // ============================================
    
    // Login Form
    const loginForm = document.querySelector('.auth-form');
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.addEventListener('submit', async function(e) {
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
        loginForm.addEventListener('submit', async function(e) {
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
    document.addEventListener('click', async function(e) {
        const addToCartBtn = e.target.closest('.add-to-cart, [data-add-to-cart]');
        if (addToCartBtn && window.API) {
            e.preventDefault();
            
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

// ============================================
// Advanced Loading Screen
// ============================================
(function() {
    const loadingScreen = document.getElementById('loading-screen');
    
    window.addEventListener('load', function() {
        if (loadingScreen) {
            // Minimum display time 2.5 giây để animation chạy đẹp
            setTimeout(function() {
                // Fade out
                loadingScreen.classList.add('fade-out');
                
                // Remove khỏi DOM sau khi fade out
                setTimeout(function() {
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
