// firebase-config.js
// Firebase configuration and initialization

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDLhqFt4rYXJgxbu5l4q50rx1FZkARyDYE",
    authDomain: "rejoice-institute-house.firebaseapp.com",
    projectId: "rejoice-institute-house",
    storageBucket: "rejoice-institute-house.firebasestorage.app",
    messagingSenderId: "154515308139",
    appId: "1:154515308139:web:72b2e940af48283c787b2e"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = firebase.auth();

// Initialize Cloud Firestore and get a reference to the service
const db = firebase.firestore();

// Export for use in other files
window.firebase = firebase;
window.auth = auth;
window.db = db;

console.log('Firebase initialized successfully');