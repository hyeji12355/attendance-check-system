const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Firebase Admin 초기화
admin.initializeApp();

exports.resetAttendanceStatus = onSchedule("0 0 * * *", {
   timeZone: "Asia/Seoul", // 한국 시간대 설정
   retryCount: 3, // 실패시 재시도 횟수
   maxRetrySeconds: 60 // 최대 재시도 시간
}, async (context) => {
   console.log("함수 실행 시작");
   const db = admin.firestore();
   const attendanceRef = db.collection("attendance");

   try {
       console.log("Firestore에서 데이터 가져오기 시작");
       const snapshot = await attendanceRef.get();
       console.log(`가져온 문서 수: ${snapshot.size}`);

       if (snapshot.empty) {
           console.log("업데이트할 문서가 없습니다");
           return null;
       }

       const batch = db.batch();
       snapshot.forEach((doc) => {
           console.log(`업데이트 중: ${doc.id}`);
           batch.update(doc.ref, { status: "not-checked" });
       });

       await batch.commit();
       console.log("Firestore 업데이트 완료");
       
   } catch (error) {
       console.error("출석 상태 초기화 중 오류 발생:", error);
       throw error; // 에러를 다시 throw하여 Functions가 실패를 인식하도록 함
   }

   console.log("함수 실행 종료");
   return null;
});
