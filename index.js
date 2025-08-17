import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

// Parol, forma va logout funksiyalari olib tashlandi
// Faqat sahifa yuklanganda to'g'ridan-to'g'ri malumotlar.html ga yo'naltiriladi

window.location.href = 'malumotlar.html';