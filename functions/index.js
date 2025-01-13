const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

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
