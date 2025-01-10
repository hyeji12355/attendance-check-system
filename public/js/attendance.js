// attendance.js

import { db } from "./firebase.js";
import { doc, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// URL에서 user_id 가져오기
const params = new URLSearchParams(window.location.search);
const userId = params.get("user_id");

if (userId) {
    // Firestore에서 사용자 데이터 업데이트
    const attendanceDoc = doc(db, "attendance", userId);
    updateDoc(attendanceDoc, {
        status: "checked",
        date: Timestamp.now()
    }).then(() => {
        document.querySelector("h1").textContent = "출석 완료!";
        document.querySelector("p").textContent = "오늘도 좋은 하루 보내세요!";
        console.log("출석 상태가 업데이트되었습니다.");
    }).catch((error) => {
        document.querySelector("h1").textContent = "오류 발생";
        document.querySelector("p").textContent = "출석 처리 중 문제가 발생했습니다.";
        console.error("출석 업데이트 실패:", error);
    });
} else {
    document.querySelector("h1").textContent = "잘못된 요청";
    document.querySelector("p").textContent = "URL에 user_id가 포함되어 있지 않습니다.";
}

