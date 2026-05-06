// Password toggle functionality
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle the eye icon
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

// Form submission handling
const loginForm = document.getElementById('loginForm');
const loginBtn = document.querySelector('button[type="submit"]');

console.log('Login form:', loginForm); // Debug log
console.log('Login button:', loginBtn); // Debug log

if (!loginForm || !loginBtn) {
    console.error('Login form or button not found!');
}

loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('Form submitted'); // Debug log
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    console.log('Email:', email, 'Password:', password); // Debug log
    
    // Basic validation
    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    console.log('Validation passed, starting login process'); // Debug log
    
    // Show loading state
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<i class="fas fa-spinner animate-spin"></i> Logging in...';
    loginBtn.disabled = true;
    loginBtn.classList.add('opacity-70', 'cursor-not-allowed');
    
    try {
        // Use Supabase authentication
        const result = await AuthService.signIn(email, password);
        
        if (result.success) {
            console.log('Login successful:', result.data); // Debug log
            
            // Show success message
            showMessage('Login successful! Redirecting...', 'success');
            
            // Redirect after successful login
            setTimeout(() => {
                console.log('Redirecting to dashboard.html'); // Debug log
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            console.error('Login failed:', result.error); // Debug log
            showMessage(result.error || 'Login failed. Please try again.', 'error');
            
            // Reset button state
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            loginBtn.classList.remove('opacity-70', 'cursor-not-allowed');
        }
    } catch (error) {
        console.error('Login error:', error); // Debug log
        showMessage('An error occurred during login. Please try again.', 'error');
        
        // Reset button state
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        loginBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    }
});

// Email validation function
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show message function
function showMessage(message, type) {
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Add styles for the message
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideInRight 0.5s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    if (type === 'error') {
        messageDiv.style.background = 'linear-gradient(135deg, #ff6b6b, #ee5a52)';
    } else if (type === 'success') {
        messageDiv.style.background = 'linear-gradient(135deg, #51cf66, #40c057)';
    }
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv) {
            messageDiv.style.animation = 'slideOutRight 0.5s ease-out';
            setTimeout(() => messageDiv.remove(), 500);
        }
    }, 5000);
}

// Add CSS animations for messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Add input focus effects
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.classList.add('scale-105');
    });
    
    input.addEventListener('blur', function() {
        this.classList.remove('scale-105');
    });
});

// Prevent form submission on Enter key in password field (optional)
passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// Auto-focus on email field when page loads
window.addEventListener('load', function() {
    console.log('Page loaded, initializing login script'); // Debug log
    document.getElementById('email').focus();
    
    // Double-check that elements are found
    const form = document.getElementById('loginForm');
    const button = document.querySelector('button[type="submit"]');
    console.log('Form found:', !!form);
    console.log('Button found:', !!button);
    
    if (!form) {
        console.error('Login form not found!');
    }
    if (!button) {
        console.error('Login button not found!');
    }
});