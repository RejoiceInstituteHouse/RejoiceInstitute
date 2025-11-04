// script.js - Rejoice Institute House - FIREBASE VERSION
console.log('Rejoice Institute House - Firebase Version Loaded');

// Firebase Authentication System
const Auth = {
    // Current user session
    currentUser: null,
    
    // Initialize auth state listener
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
                });
                console.log('User signed in:', user.email);
            } else {
                this.currentUser = null;
                localStorage.removeItem('currentUser');
                console.log('User signed out');
            }
            this.updateAuthUI();
        });
        
        // Restore from localStorage if available
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
        }
        
        this.updateAuthUI();
    },
    
    // Register new user with Firebase - FIXED VERSION
    register: async function(userData) {
        try {
            // Create user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(
                userData.email, 
                userData.password
            );
            
            const user = userCredential.user;
            
            // ✅ FIX: Use the user_type from the form instead of email detection
            let userType = userData.user_type || 'reader'; // Default to reader if not specified
            
            console.log('🎯 Registration - User selected type:', userType);
            
            // Create user profile in Firestore
            await this.createUserProfile(user.uid, {
                firstName: userData.first_name, // Fixed to match form field name
                lastName: userData.last_name,   // Fixed to match form field name
                email: userData.email,
                userType: userType, // ✅ This now uses the form selection
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
            
            return { 
                success: true, 
                user: user,
                userType: userType // ✅ Return the actual user type
            };
            
        } catch (error) {
            console.error('Registration error:', error);
            return { 
                success: false, 
                message: this.getErrorMessage(error) 
            };
        }
    },
    
    // Login user with Firebase
    login: async function(email, password) {
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user profile
            const profile = await this.getUserProfile(user.uid);
            user.profile = profile;
            
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
    
    // Logout user
    logout: async function() {
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Create user profile in Firestore
    createUserProfile: async function(uid, userData) {
        try {
            await db.collection('users').doc(uid).set(userData);
            console.log('User profile created for:', uid, 'with data:', userData);
        } catch (error) {
            console.error('Error creating user profile:', error);
            throw error;
        }
    },
    
    // Get user profile from Firestore
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
    
    // Update user profile
    updateUserProfile: async function(uid, updates) {
        try {
            await db.collection('users').doc(uid).update(updates);
            console.log('User profile updated for:', uid);
            return { success: true };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, message: error.message };
        }
    },
    
    // Determine user type based on email (Keep for admin detection if needed)
    determineUserType: function(email) {
        console.log('Determining user type for email:', email);
        
        if (!email) {
            console.log('No email provided, defaulting to reader');
            return 'reader';
        }
        
        const userEmail = email.toLowerCase();
        console.log('Normalized email:', userEmail);
        
        // =============================================
        // 🎯 MODIFY THESE EMAIL LISTS AS NEEDED
        // =============================================
        const adminEmails = [
            'rejoiceinstitutehouse@gmail.com',
            'admin@rejoiceinstitute.org',
            'test-admin@test.com'
        ];
        
        const authorEmails = [
            'khosapromise12@gmail.com',
            'writer@rejoiceinstitute.org',
            'test-author@test.com',
            'elena.rodriguez@example.com',
            'james.wilson@example.com'
        ];
        
        const artistEmails = [
            'artist@rejoiceinstitute.org',
            'designer@rejoiceinstitute.org',
            'test-artist@test.com'
        ];
        
        console.log('Checking against admin emails:', adminEmails);
        console.log('Checking against author emails:', authorEmails);
        console.log('Checking against artist emails:', artistEmails);
        
        if (adminEmails.includes(userEmail)) {
            console.log('✅ User detected as ADMIN');
            return 'admin';
        } else if (authorEmails.includes(userEmail)) {
            console.log('✅ User detected as AUTHOR');
            return 'author';
        } else if (artistEmails.includes(userEmail)) {
            console.log('✅ User detected as ARTIST');
            return 'artist';
        } else {
            console.log('✅ User detected as READER (default)');
            return 'reader';
        }
    },
    
    // Check if user is logged in
    isLoggedIn: function() {
        return this.currentUser !== null;
    },
    
    // Get current user
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // Get error message from Firebase error
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
    
    // Update UI based on authentication state
    updateAuthUI: function() {
        const authButtons = document.querySelector('.auth-buttons');
        
        if (authButtons) {
            if (this.isLoggedIn()) {
                const user = this.getCurrentUser();
                const displayName = user.profile?.firstName || user.email?.split('@')[0] || 'User';
                
                const dashboardPath = window.location.pathname.includes('/pages/') ? 'dashboard.html' : 'pages/dashboard.html';
                const homePath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
                
                authButtons.innerHTML = `
                    <span class="user-welcome">Welcome, ${displayName}!</span>
                    <a href="${dashboardPath}" class="btn btn-login">Dashboard</a>
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
                const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
                const registerPath = window.location.pathname.includes('/pages/') ? 'register.html' : 'pages/register.html';
                
                authButtons.innerHTML = `
                    <a href="${loginPath}" class="btn btn-login">Login</a>
                    <a href="${registerPath}" class="btn btn-register">Register</a>
                `;
            }
        }
    },
    
    // Logout and redirect to home
    logoutAndRedirect: function() {
        this.logout().then(() => {
            const homePath = window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
            window.location.href = homePath;
        });
    },
    
    // Protect routes - redirect to login if not authenticated
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            const loginPath = window.location.pathname.includes('/pages/') ? 'login.html' : 'pages/login.html';
            window.location.href = loginPath;
            return false;
        }
        return true;
    }
};

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');
    
    // Wait for Firebase to be ready
    if (typeof firebase !== 'undefined') {
        // Initialize authentication system
        Auth.init();
        
        // Initialize all JavaScript functionality
        initSmoothScrolling();
        initFormInteractions(); // ✅ This will now handle the registration form correctly
        initButtonEffects();
        initImagePlaceholders();
        initNavigationActiveState();
        initDashboardFeatures();
        
        // Initialize dashboard router if on dashboard page
        if (window.location.pathname.includes('dashboard')) {
            initDashboardRouter();
        }
    } else {
        console.error('Firebase not loaded');
    }
});

// Enhanced Form Interactions with Firebase Registration
function initFormInteractions() {
    console.log('Initializing form interactions...');
    
    // Registration Form Handler - UPDATED
    const registerForm = document.querySelector('.auth-form');
    if (registerForm && window.location.pathname.includes('register.html')) {
        console.log('Register form found, attaching event listener...');
        
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submitted!');
            
            // Get form data
            const formData = new FormData(this);
            const userData = {
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                email: formData.get('email'),
                user_type: formData.get('user_type'), // ✅ This is the key fix!
                password: formData.get('password')
            };
            
            console.log('🎯 Form user_type:', userData.user_type);
            
            // Basic validation
            if (formData.get('password') !== formData.get('confirm_password')) {
                alert('Passwords do not match!');
                return;
            }
            
            // Show loading state
            const submitBtn = this.querySelector('.auth-submit');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Creating Account...';
            submitBtn.disabled = true;
            
            try {
                // Register user with Firebase
                const result = await Auth.register(userData);
                
                if (result.success) {
                    console.log('✅ Registration successful! User type:', result.userType);
                    
                    // ✅ REDIRECT BASED ON USER TYPE
                    const dashboards = {
                        'reader': 'dashboard-reader.html',
                        'writer': 'dashboard-author.html', // Map 'writer' to author dashboard
                        'author': 'dashboard-author.html',
                        'artist': 'dashboard-artist.html', 
                        'student': 'dashboard-reader.html', // Students go to reader dashboard
                        'professional': 'dashboard-reader.html' // Professionals go to reader dashboard
                    };
                    
                    const targetDashboard = dashboards[result.userType] || 'dashboard-reader.html';
                    console.log('🎯 Redirecting to:', targetDashboard);
                    
                    // Show success message
                    alert(`Account created successfully! Welcome, ${userData.first_name}!`);
                    
                    // Redirect to appropriate dashboard
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
    
    // Login Form Handler (keep existing)
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
                    
                    // Get user profile to determine dashboard
                    const userProfile = result.user.profile;
                    const userType = userProfile?.userType || 'reader';
                    
                    console.log('🎯 Login - User type:', userType);
                    
                    const dashboards = {
                        'reader': 'dashboard-reader.html',
                        'writer': 'dashboard-author.html',
                        'author': 'dashboard-author.html',
                        'artist': 'dashboard-artist.html',
                        'admin': 'dashboard-admin.html'
                    };
                    
                    const targetDashboard = dashboards[userType] || 'dashboard-reader.html';
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

// Enhanced Dashboard Router with Better Debugging
function initDashboardRouter() {
    console.log('=== INIT DASHBOARD ROUTER ===');
    
    // Check authentication first
    if (!Auth.requireAuth()) return;
    
    const user = Auth.getCurrentUser();
    
    // Only run on main dashboard page
    if (!window.location.pathname.includes('dashboard.html') || 
        window.location.pathname.includes('dashboard-')) return;
    
    function redirectToDashboard() {
        const userRole = user.profile?.userType || 'reader';
        console.log('🎯 Dashboard Router - User role:', userRole);
        
        const dashboards = {
            'reader': 'dashboard-reader.html',
            'writer': 'dashboard-author.html',
            'author': 'dashboard-author.html',
            'artist': 'dashboard-artist.html',
            'admin': 'dashboard-admin.html'
        };
        
        const targetDashboard = dashboards[userRole] || 'dashboard-reader.html';
        console.log('🎯 Dashboard redirecting to:', targetDashboard);
        
        // Immediate redirect (no delay)
        window.location.href = targetDashboard;
    }

    // Update welcome message and redirect
    const welcomeElement = document.querySelector('.user-welcome');
    if (welcomeElement && user.profile) {
        welcomeElement.textContent = `Welcome, ${user.profile.firstName}!`;
    }
    
    redirectToDashboard();
}

// [Keep all your other existing functions exactly as they were]
// initSmoothScrolling, initButtonEffects, initImagePlaceholders, 
// initNavigationActiveState, initDashboardFeatures, animateProgressBars, 
// addRippleStyles, etc.

// Your existing functions here...
function initSmoothScrolling() {
    // Your existing smooth scrolling code
}

function initButtonEffects() {
    // Your existing button effects code
}

function initImagePlaceholders() {
    // Your existing image placeholder code
}

function initNavigationActiveState() {
    // Your existing navigation code
}

function initDashboardFeatures() {
    // Your existing dashboard features code
}

function animateProgressBars() {
    // Your existing progress bars code
}

// Add CSS for ripple animation and other styles
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .btn.hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .error {
            border-color: var(--color-error) !important;
        }
        
        .success {
            border-color: var(--color-success) !important;
        }
        
        .nav-links a.active {
            color: var(--color-purple);
            font-weight: bold;
        }
        
        .dashboard-card {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .dashboard-card:hover {
            transform: translateY(-5px);
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
        
        .user-welcome {
            color: var(--color-purple);
            font-weight: 500;
            margin-right: 1rem;
        }
        
        .auth-success, .auth-error {
            animation: fadeIn 0.3s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .firebase-loading {
            text-align: center;
            padding: 2rem;
            color: var(--color-purple);
        }
        
        /* Registration success styles */
        .registration-success {
            background: var(--color-success);
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
        }
    `;
    document.head.appendChild(style);
}

// Add the ripple styles when the script loads
addRippleStyles();

console.log('✅ Updated script.js loaded - Fixed user type registration!');