const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
    admin.initializeApp();
}

// Firestore 접근 객체
const db = admin.firestore();

module.exports = { db };
