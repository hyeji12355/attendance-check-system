const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const cors = require('cors')({origin: true});

// Firebase Admin 초기화
admin.initializeApp();

// 1. Access Token 발급 함수
async function getAccessToken() {
   try {
       const base64Credentials = Buffer.from(`${process.env.PPURIO_USER_ID}:${process.env.PPURIO_API_KEY}`).toString('base64');
       
       const response = await fetch('https://message.ppurio.com/v1/token', {
           method: 'POST',
           headers: {
               Authorization: `Basic ${base64Credentials}`
           }
       });
       if (!response.ok) {
           throw new Error(`Access Token 발급 실패: ${response.statusText}`);
       }
       const data = await response.json();
       console.log("발급된 Access Token:", data.token);
       return data.token; // 발급된 토큰 반환
   } catch (error) {
       console.error("Access Token 발급 중 오류 발생:", error);
       throw error;
   }
}

// 2. resetAttendanceStatus 함수
exports.resetAttendanceStatus = onSchedule({
   schedule: "0 15 * * *", // UTC 기준 15:00 (한국 시간 00:00)
   timeZone: "Etc/UTC",
   region: "us-central1",
   memory: "256MiB",
}, async (context) => {
   console.log("함수 실행 시작");
   const db = admin.firestore();
   const attendanceRef = db.collection("attendance");
   try {
       console.log("Firestore에서 데이터 가져오기 시작");
       const snapshot = await attendanceRef.get();
       console.log(`가져온 문서 수: ${snapshot.size}`);
       const batch = db.batch();
       snapshot.forEach((doc) => {
           console.log(`업데이트 중: ${doc.id}`);
           batch.update(doc.ref, { status: "not-checked" });
       });
       await batch.commit();
       console.log("Firestore 업데이트 완료");

       // 새로운 출석 로그 생성
       const today = new Date();
       const dateString = today.toISOString().split('T')[0];
       const logsData = {
           createdAt: admin.firestore.FieldValue.serverTimestamp(),
           date: dateString,
           attendances: {}
       };

       // 각 사용자의 초기 출석 상태 설정
       snapshot.forEach(doc => {
           logsData.attendances[doc.id] = {
               status: "not-checked",
               checkInTime: null,
               checkOutTime: null
           };
       });

       // attendance_logs 컬렉션에 새 문서 생성
       await db.collection("attendance_logs").doc(dateString).set(logsData);
       console.log(`${dateString} 출석 로그 생성 완료`);
   } catch (error) {
       console.error("처리 중 오류 발생:", error);
       throw error;
   }
   console.log("함수 실행 종료");
   return null;
});

// 3. sendAlarm 함수
exports.sendAlarm = functions.https.onRequest(async (req, res) => {
   return cors(req, res, async () => {
       if (req.method !== 'POST') {
           res.status(405).send('Method Not Allowed');
           return;
       }
       try {
           // Access Token 발급
           const accessToken = await getAccessToken();
           const { phone, templateId, variables } = req.body;

           console.log('요청 데이터:', { phone, templateId, variables }); // 디버깅용 로그

           // 뿌리오 API 호출
           const response = await fetch('https://message.ppurio.com/v1/kakao', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
                   Authorization: `Bearer ${accessToken}`
               },
               body: JSON.stringify({
                   senderProfile: "@뿌리오", // 발신 프로필명
                   templateCode: templateId,
                   targets: [
                       {
                           to: phone,
                           changeWord: variables
                       }
                   ]
               })
           });

           if (!response.ok) {
               const errorData = await response.text();
               console.error('뿌리오 API 오류 응답:', errorData);
               throw new Error('알람톡 발송 실패');
           }

           console.log('알람톡 발송 성공');
           res.status(200).send('알람톡 발송 성공');
       } catch (error) {
           console.error('알람톡 발송 오류:', error);
           res.status(500).send('알람톡 발송 실패');
       }
   });
});
