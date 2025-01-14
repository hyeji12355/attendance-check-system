import { db } from "./firebase.js";
import {
   collection,
   getDocs,
   doc,
   updateDoc,
   Timestamp,
   getDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const userId = params.get("user_id");

// 알람톡 발송 함수
async function sendAlarmTalk(phone, templateId, variables) {
   try {
       const response = await fetch('https://sendalarm-ldpq5bshlq-uc.a.run.app', { // Cloud Run URL로 수정
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify({
               phone,
               templateId,
               variables
           })
       });

       if (!response.ok) {
           const errorResponse = await response.text(); // 응답 본문을 확인
           throw new Error(`알람톡 발송 실패: ${response.status} ${errorResponse}`);
       }

       console.log('알람톡 발송 성공');
   } catch (error) {
       console.error('알람톡 발송 중 오류:', error);
       throw error;
   }
}

// 출석 알림 발송 함수
async function sendAttendanceNotification(userId) {
   try {
       const userDoc = await getDoc(doc(db, "users", userId));
       if (!userDoc.exists()) {
           throw new Error('사용자 정보를 찾을 수 없음');
       }
       const userData = userDoc.data();
       const variables = { name: userData.name };
       await sendAlarmTalk(userData.contact, 'ppur_2025010219515692092846588', variables);
       if (userData.preferences?.notify_guardian) {
           await sendAlarmTalk(userData.guardian_contact, 'ppur_2025010219515692092846588', variables);
       }
       console.log('출석 알림 발송 완료');
   } catch (error) {
       console.error('출석 알림 발송 중 오류:', error);
   }
}

// 출석 확인 및 업데이트
if (userId) {
   const attendanceDoc = doc(db, "attendance", userId);
   getDoc(attendanceDoc)
       .then((docSnap) => {
           if (docSnap.exists()) {
               // 업데이트 로직: checkInTime 추가
               updateDoc(attendanceDoc, {
                   status: "checked",
                   date: Timestamp.now(),
                   checkInTime: Timestamp.now() // 현재 시간 기록
               }).then(() => {
                   document.querySelector("span.emoji").textContent = "✅";
                   document.querySelector("h1").textContent = "출석 완료!";
                   document.querySelector("p").innerHTML = "오늘도 좋은 하루 보내세요! 💫";
                   sendAttendanceNotification(userId).catch(console.error);
               }).catch(() => {
                   document.querySelector("span.emoji").textContent = "❌";
                   document.querySelector("h1").textContent = "오류 발생";
                   document.querySelector("p").innerHTML = '지속적인 오류 발생 시 <span class="kakao-text">365 안부톡</span>으로 문의 부탁드립니다.';
               });
           } else {
               document.querySelector("span.emoji").textContent = "❌";
               document.querySelector("h1").textContent = "오류 발생";
               document.querySelector("p").innerHTML = '지속적인 오류 발생 시 <span class="kakao-text">365 안부톡</span>으로 문의 부탁드립니다.';
           }
       }).catch(() => {
           document.querySelector("span.emoji").textContent = "❌";
           document.querySelector("h1").textContent = "오류 발생";
           document.querySelector("p").innerHTML = '지속적인 오류 발생 시 <span class="kakao-text">365 안부톡</span>으로 문의 부탁드립니다.';
       });
} else {
   document.querySelector("span.emoji").textContent = "❌";
   document.querySelector("h1").textContent = "오류 발생";
   document.querySelector("p").innerHTML = '지속적인 오류 발생 시 <span class="kakao-text">365 안부톡</span>으로 문의 부탁드립니다.';
}
