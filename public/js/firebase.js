// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase 설정
const firebaseConfig = {
    apiKey: "AIzaSyDZlLaZ61B3s2UrytwDo6XfD07WO5GSG78",
    authDomain: "attendance-check-system.firebaseapp.com",
    projectId: "attendance-check-system",
    storageBucket: "attendance-check-system.appspot.com",
    messagingSenderId: "310374000832",
    appId: "1:310374000832:web:cbc5c82db331ec2a3ca525"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

