import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyACHEuejKVniBAcYExQxk23A9QD84bUaB4",
    authDomain: "new-project-6075a.firebaseapp.com",
    projectId: "new-project-6075a",
    storageBucket: "new-project-6075a.appspot.com",
    messagingSenderId: "974403904500",
    appId: "1:974403904500:web:5d4edb5db8f5432cbdcfa1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const loginForm = document.getElementById('loginForm');
const securityCodeInput = document.getElementById('securityCode');
const togglePasswordBtn = document.getElementById('togglePassword');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const loadingSpinner = document.getElementById('loadingSpinner');

// Security code
const amarco = '9860190109072172';

// Store authentication in localStorage as a fallback
function setAuthenticated() {
    localStorage.setItem('adminAuthenticated', 'true');
    localStorage.setItem('adminAuthTime', Date.now().toString());
}

function isAuthenticated() {
    const authTime = localStorage.getItem('adminAuthTime');
    if (!authTime) return false;
    
    // Check if authentication is still valid (24 hours)
    const now = Date.now();
    const authTimestamp = parseInt(authTime);
    const validDuration = 24 * 60 * 60 * 1000; // 24 hours
    
    return (now - authTimestamp) < validDuration;
}

// Check if user is already authenticated
onAuthStateChanged(auth, (user) => {
    console.log('Auth state changed:', user);
    if (user || isAuthenticated()) {
        // User is already authenticated, redirect to admin panel
        window.location.href = 'malumotlar.html';
    }
});

// Toggle password visibility
togglePasswordBtn.addEventListener('click', () => {
    const type = securityCodeInput.type === 'password' ? 'text' : 'password';
    securityCodeInput.type = type;
    
    const icon = togglePasswordBtn.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
});

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const enteredCode = securityCodeInput.value.trim();
    
    // Show loading
    showLoading();
    hideError();
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Check if code is correct
    if (enteredCode === amarco) {
        try {
            console.log('Correct code entered, signing in anonymously...');
            
            // Set authentication in localStorage
            setAuthenticated();
            
            try {
                // Try to sign in anonymously to Firebase
                const userCredential = await signInAnonymously(auth);
                console.log('Anonymous sign-in successful:', userCredential.user);
            } catch (error) {
                console.log('Anonymous sign-in failed, but continuing with localStorage auth:', error);
            }
            
            // Add a small delay to ensure auth state is properly set
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Success - redirect to admin panel
            window.location.href = 'malumotlar.html';
        } catch (error) {
            console.error('Authentication error:', error);
            showError('Autentifikatsiya xatosi! Iltimos, qaytadan urinib ko\'ring.');
            hideLoading();
        }
    } else {
        // Show error
        showError('Noto\'g\'ri xavfsizlik kodi! Iltimos, qaytadan urinib ko\'ring.');
        securityCodeInput.value = '';
        securityCodeInput.focus();
        hideLoading();
    }
});

// Show loading spinner
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    loginForm.querySelector('button[type="submit"]').disabled = true;
}

// Hide loading spinner
function hideLoading() {
    loadingSpinner.classList.add('hidden');
    loginForm.querySelector('button[type="submit"]').disabled = false;
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

// Hide error message
function hideError() {
    errorMessage.classList.add('hidden');
}

// Focus on input when page loads
window.addEventListener('load', () => {
    securityCodeInput.focus();
});

// Handle Enter key
securityCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        loginForm.dispatchEvent(new Event('submit'));
    }
});

// Clear error when user starts typing
securityCodeInput.addEventListener('input', () => {
    if (!errorMessage.classList.contains('hidden')) {
        hideError();
    }
});