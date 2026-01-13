/* ============================================
   BanglaKompost - JavaScript
   Interactions & Form Handling
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================
    // Utility Functions
    // ============================================
    window.scrollToForm = function() {
        const form = document.getElementById('pickup');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    // ============================================
    // Navigation Toggle (Mobile)
    // ============================================
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        
        // Toggle hamburger icon
        const icon = navToggle.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            const icon = navToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
            navMenu.classList.remove('active');
            const icon = navToggle.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // ============================================
    // Navbar Scroll Effect
    // ============================================
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // ============================================
    // Back to Top Button
    // ============================================
    const backToTop = document.getElementById('back-to-top');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 500) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    backToTop.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // ============================================
    // Smooth Scroll for Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // ============================================
    // Form Handling
    // ============================================
    const pickupForm = document.getElementById('pickup-form');
    const formSuccess = document.getElementById('form-success');
    
    pickupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData(pickupForm);
        const data = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            address: formData.get('address'),
            wasteType: formData.get('waste-type'),
            quantity: formData.get('quantity'),
            message: formData.get('message')
        };
        
        // Validate phone number (Bangladesh format)
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!phoneRegex.test(data.phone.replace(/\s+/g, ''))) {
            showNotification('Please enter a valid Bangladesh phone number (01XXXXXXXXX)', 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = pickupForm.querySelector('.btn-submit');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        submitBtn.disabled = true;
        
        // Simulate form submission (replace with actual API call)
        setTimeout(function() {
            // Hide form and show success message
            pickupForm.style.display = 'none';
            formSuccess.classList.add('show');
            
            // Log form data (for testing)
            console.log('Form submitted:', data);
            
            // Show notification
            showNotification('Thank you! Your pickup request has been submitted.', 'success');
            
            // Reset form
            pickupForm.reset();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Scroll to success message
            formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
        }, 1500);
        
        // For Google Forms integration (uncomment and update URL)
        /*
        const googleFormURL = 'YOUR_GOOGLE_FORM_ACTION_URL';
        
        fetch(googleFormURL, {
            method: 'POST',
            mode: 'no-cors',
            body: formData
        })
        .then(() => {
            pickupForm.style.display = 'none';
            formSuccess.classList.add('show');
            showNotification('Thank you! Your pickup request has been submitted.', 'success');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Something went wrong. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        });
        */
    });
    
    // ============================================
    // Notification System
    // ============================================
    function showNotification(message, type = 'info') {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 90%;
        `;
        
        // Add animation keyframes
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
    
    // ============================================
    // Intersection Observer for Animations
    // ============================================
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const animateOnScroll = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Add animation styles
    const animationStyles = document.createElement('style');
    animationStyles.textContent = `
        .animate-target {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .animate-target.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        .animate-delay-1 { transition-delay: 0.1s; }
        .animate-delay-2 { transition-delay: 0.2s; }
        .animate-delay-3 { transition-delay: 0.3s; }
        .animate-delay-4 { transition-delay: 0.4s; }
    `;
    document.head.appendChild(animationStyles);
    
    // Apply to elements
    const animateElements = document.querySelectorAll('.problem-card, .step-card, .impact-card, .process-step, .team-member');
    animateElements.forEach((el, index) => {
        el.classList.add('animate-target', `animate-delay-${(index % 4) + 1}`);
        animateOnScroll.observe(el);
    });
    
    // ============================================
    // Counter Animation for Stats
    // ============================================
    function animateCounter(element, target, duration = 2000) {
        let start = 0;
        const increment = target / (duration / 16);
        
        function updateCounter() {
            start += increment;
            if (start < target) {
                element.textContent = Math.floor(start);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }
        
        updateCounter();
    }
    
    // Observe stat numbers
    const statsObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const text = stat.textContent;
                    const number = parseInt(text.replace(/\D/g, ''));
                    if (!isNaN(number) && number > 0) {
                        // Keep the suffix if any
                        const suffix = text.replace(/[\d]/g, '');
                        animateCounter(stat, number, 1500);
                        setTimeout(() => {
                            stat.textContent = text;
                        }, 1600);
                    }
                });
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) {
        statsObserver.observe(heroStats);
    }
    
    // ============================================
    // Phone Number Formatting
    // ============================================
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) {
                value = value.slice(0, 11);
            }
            e.target.value = value;
        });
    }
    
    // ============================================
    // Form Field Validation Styling
    // ============================================
    const formInputs = document.querySelectorAll('.pickup-form input, .pickup-form textarea, .pickup-form select');
    
    formInputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.required && !this.value.trim()) {
                this.style.borderColor = '#F44336';
            } else {
                this.style.borderColor = '#4CAF50';
            }
        });
        
        input.addEventListener('focus', function() {
            this.style.borderColor = '#2E7D32';
        });
    });
    
    // ============================================
    // Preloader (Optional)
    // ============================================
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
    
    // ============================================
    // Console Welcome Message
    // ============================================
    console.log('%c🌱 BanglaKompost', 'font-size: 24px; font-weight: bold; color: #2E7D32;');
    console.log('%cTurning organic waste into valuable compost for Bangladesh', 'font-size: 14px; color: #6D4C41;');
    console.log('%cA UITS Student Initiative for Hult Prize 2026', 'font-size: 12px; color: #9E9E9E;');
    
});

// ============================================
// Google Forms Integration Helper
// ============================================
/*
 * To integrate with Google Forms:
 * 
 * 1. Create a Google Form with these fields:
 *    - Name (Short answer)
 *    - Phone (Short answer)
 *    - Address (Paragraph)
 *    - Waste Type (Dropdown)
 *    - Quantity (Dropdown)
 *    - Message (Paragraph)
 * 
 * 2. Get the form's pre-filled link and extract entry IDs
 *    Example: entry.123456789, entry.987654321, etc.
 * 
 * 3. Update the form action URL and field names in the HTML:
 *    <form action="https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse" method="POST">
 *    <input name="entry.123456789" ...>
 * 
 * 4. For iframe/ajax submission (no redirect):
 *    - Use the fetch method shown in the form handler above
 *    - Set mode: 'no-cors' (you won't get a response, but it will submit)
 */

// ============================================
// WhatsApp Integration Helper
// ============================================
function openWhatsApp(phoneNumber, message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// Example: Button to send WhatsApp message
// <button onclick="openWhatsApp('8801XXXXXXXXX', 'Hello, I want to request a waste pickup!')">
//     WhatsApp Us
// </button>
