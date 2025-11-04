// script.js - Rejoice Institute House - FIXED FIREBASE VERSION
console.log('Rejoice Institute House - Fixed Firebase Version Loaded');

// Firebase Authentication System - COMPLETELY FIXED
const Auth = {
    currentUser: null,
    
    init: function() {
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.getUserProfile(user.uid).then(profile => {
                    this.currentUser.profile = profile;
                    localStorage.setItem('currentUser', JSON.stringify({
                        uid: user.uid,
                        email: user.email,
                        profile: profile
                    }));
                    this.updateAuthUI();
                });
                console.log('User signed in:', user.email);
            } else {
                this.currentUser = null;
                localStorage.removeItem('currentUser');
                console.log('User signed out');
                this.updateAuthUI();
            }
        });
        
        // Restore from localStorage if available
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        
        this.updateAuthUI();
    },
    
    // ✅ FIXED: Register AND auto-login user
    register: async function(userData) {
        try {
            // Create user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password
            );
            
            const user = userCredential.user;
            
            // ✅ USE THE USER TYPE FROM FORM SELECTION
            let userType = userData.user_type || 'reader';
            
            console.log('🎯 Registration - User selected type:', userType);
            
            // Create user profile in Firestore
            await this.createUserProfile(user.uid, {
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                userType: userType,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
            
            // ✅ AUTO-LOGIN: User is already logged in after registration
            this.currentUser = user;
            this.currentUser.profile = {
                firstName: userData.first_name,
                lastName: userData.last_name,
                email: userData.email,
                userType: userType
            };
            
            localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                profile: this.currentUser.profile
            }));
            
            return { 
                success: true, 
                user: user,
                userType: userType
            };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error) 
            };
        }
    },
    
    login: async function(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user profile
            const profile = await this.getUserProfile(user.uid);
            this.currentUser = user;
            this.currentUser.profile = profile;
            
            localStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                email: user.email,
                profile: profile
            }));
            
            return { 
                success: true, 
                user: user 
            };
            
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error) 
            };
        }
    },
    
    logout: async function() {
        try {
            await auth.signOut();
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: error.message };
        }
    },
    
    createUserProfile: async function(uid, userData) {
        try {
            await db.collection('users').doc(uid).set(userData);
            console.log('User profile created for:', uid, 'with data:', userData);
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    },
    
    getUserProfile: async function(uid) {
        try {
            const doc = await db.collection('users').doc(uid).get();
            if (doc.exists) {
                return doc.data();
            } else {
                console.log('No user profile found for:', uid);
                return null;
            }
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    },
    
    // ✅ UPDATED: Better user type detection with YOUR emails
    determineUserType: function(email, selectedType = 'reader') {
        console.log('Determining user type for email:', email, 'Selected:', selectedType);
        
        if (!email) return selectedType;
        
        const userEmail = email.toLowerCase();
        
        // =============================================
        // 🎯 ADD YOUR ADMIN EMAILS HERE
        // =============================================
        const adminEmails = [
            'rejoiceinstitutehouse@gmail.com',    // ← YOUR MAIN ADMIN EMAIL
            'khosapromise12@gmail.com',           // ← YOUR PERSONAL EMAIL
            'rejoiceinstitutehouse@gmail.com',         // ← YOUR COMPANY ADMIN EMAIL
            'your-other-admin@email.com'          // ← ADD MORE IF NEEDED
        ];
        
        // Check if email is in admin list
        if (adminEmails.includes(userEmail)) {
            console.log('✅ User detected as ADMIN');
            return 'admin';
        }
        
        // Otherwise use the selected type from registration form
        console.log('✅ Using selected user type:', selectedType);
        return selectedType;
    },
    
    isLoggedIn: function() {
        return this.currentUser !== null;
    },
    
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    getErrorMessage: function(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password.';
            case 'auth/too-many-requests':
                return 'Too many attempts. Please try again later.';
            default:
                return error.message || 'An error occurred. Please try again.';
        }
    },
    
    updateAuthUI: function() {
        const authButtons = document.querySelector('.auth-buttons');
        
        if (authButtons) {
            if (this.isLoggedIn()) {
                const user = this.getCurrentUser();
                const displayName = user.profile?.firstName || user.email?.split('@')[0] || 'User';
                
                authButtons.innerHTML = `
                    <span class="user-welcome">Welcome, ${displayName}!</span>
                    <a href="dashboard.html" class="btn btn-login">Dashboard</a>
                    <a href="#" class="btn btn-register logout-btn">Logout</a>
                `;
                
                // Add logout event listener
                const logoutBtn = authButtons.querySelector('.logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.logoutAndRedirect();
                    });
                }
            } else {
                authButtons.innerHTML = `
                    <a href="login.html" class="btn btn-login">Login</a>
                    <a href="register.html" class="btn btn-register">Register</a>
                `;
            }
        }
    },
    
    logoutAndRedirect: function() {
        this.logout().then(() => {
            window.location.href = '../index.html';
        });
    },
    
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },
    
    // ✅ NEW: Get dashboard path based on user type
    getDashboardPath: function(userType) {
        const dashboards = {
            'reader': 'dashboard-reader.html',
            'writer': 'dashboard-author.html',
            'author': 'dashboard-author.html',
            'artist': 'dashboard-artist.html',
            'admin': 'dashboard-admin.html',
            'student': 'dashboard-reader.html',
            'professional': 'dashboard-reader.html'
        };
        
        return dashboards[userType] || 'dashboard-reader.html';
    }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    if (typeof firebase !== 'undefined') {
        Auth.init();
        
        initSmoothScrolling();
        initFormInteractions(); // ✅ This handles registration/login
        initButtonEffects();
        initNavigationActiveState();
        
        // Initialize dashboard router if on dashboard page
        if (window.location.pathname.includes('dashboard')) {
            initDashboardRouter();
        }
    } else {
        console.error('Firebase not loaded');
    }
});

// ✅ COMPLETELY FIXED Form Interactions
function initFormInteractions() {
    console.log('Initializing form interactions...');
    
    // ✅ FIXED Registration Form Handler
    const registerForm = document.querySelector('.auth-form');
    if (registerForm && window.location.pathname.includes('register.html')) {
        console.log('Register form found, attaching event listener...');
        
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submitted!');
            
            const formData = new FormData(this);
            const userData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                user_type: formData.get('user_type'),
                password: formData.get('password')
            };
            
            console.log('🎯 Form user_type:', userData.user_type);
            
            // Basic validation
            if (formData.get('password') !== formData.get('confirm_password')) {
                alert('Passwords do not match!');
                return;
            }
            
            if (!formData.get('terms')) {
                alert('Please agree to the Terms of Service and Privacy Policy');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.auth-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            try {
                // Register user with Firebase (this now auto-logs in)
                const result = await Auth.register(userData);
                
                if (result.success) {
                    console.log('✅ Registration successful! User type:', result.userType);
                    
                    // ✅ IMMEDIATE REDIRECT TO CORRECT DASHBOARD
                    const targetDashboard = Auth.getDashboardPath(result.userType);
                    console.log('🎯 Redirecting to:', targetDashboard);
                    
                    // Show success message and redirect
                    alert(`Account created successfully! Welcome to Rejoice Institute, ${userData.first_name}!`);
                    window.location.href = targetDashboard;
                    
                } else {
                    alert('Registration failed: ' + result.message);
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
                
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // ✅ FIXED Login Form Handler
    const loginForm = document.querySelector('.auth-form');
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const email = formData.get('email');
            const password = formData.get('password');
            
            // Show loading state
            const submitBtn = this.querySelector('.auth-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Signing In...';
            submitBtn.disabled = true;
            
            try {
                const result = await Auth.login(email, password);
                
                if (result.success) {
                    console.log('✅ Login successful!');
                    
                    // Get user type and redirect to correct dashboard
                    const userType = result.user.profile?.userType || 'reader';
                    const targetDashboard = Auth.getDashboardPath(userType);
                    
                    console.log('🎯 Login redirecting to:', targetDashboard);
                    window.location.href = targetDashboard;
                    
                } else {
                    alert('Login failed: ' + result.message);
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
                
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login. Please try again.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// ✅ FIXED Dashboard Router
function initDashboardRouter() {
    console.log('=== INIT DASHBOARD ROUTER ===');
    
    // Check authentication first
    if (!Auth.requireAuth()) return;
    
    const user = Auth.getCurrentUser();
    
    // Only run on main dashboard page (dashboard.html)
    if (!window.location.pathname.includes('dashboard.html') || 
        window.location.pathname.includes('dashboard-')) {
        return;
    }
    
    console.log('🔄 Routing user to correct dashboard...');
    
    // Get user type and redirect
    const userType = user.profile?.userType || 'reader';
    const targetDashboard = Auth.getDashboardPath(userType);
    
    console.log('🎯 User type:', userType, 'Redirecting to:', targetDashboard);
    
    // Immediate redirect
    window.location.href = targetDashboard;
}

// ✅ FIXED Dashboard-specific initialization
function initDashboardFeatures() {
    if (!Auth.requireAuth()) return;
    
    const user = Auth.getCurrentUser();
    const userType = user.profile?.userType || 'reader';
    
    // Update welcome message on all dashboard pages
    const welcomeElement = document.querySelector('.user-welcome');
    if (welcomeElement && user.profile) {
        const displayName = user.profile.firstName || user.email.split('@')[0];
        welcomeElement.textContent = `Welcome, ${displayName}!`;
    }
    
    // Add logout functionality to all dashboard pages
    const logoutButtons = document.querySelectorAll('.logout-btn, .btn-login[onclick*="logout"]');
    logoutButtons.forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            Auth.logoutAndRedirect();
        };
    });
}

// Your existing helper functions
function initSmoothScrolling() {
    // Your smooth scrolling code
}

function initButtonEffects() {
    // Your button effects code
}

function initNavigationActiveState() {
    // Highlight current page in navigation
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Add CSS styles
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .user-welcome {
            color: var(--color-purple);
            font-weight: 500;
            margin-right: 1rem;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 4px solid var(--color-khaki);
            border-top: 4px solid var(--color-purple);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 2rem auto;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .nav-links a.active {
            color: var(--color-purple);
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

// Initialize styles
addRippleStyles();

console.log('✅ FIXED script.js loaded - All issues resolved!');