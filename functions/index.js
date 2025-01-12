const functions = require('firebase-functions/v2');
const admin = require("firebase-admin");

admin.initializeApp();

exports.resetAttendanceStatus = functions.scheduler
  .onSchedule('0 0 * * *', {
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3'
  })
  .onRun(async (context) => {
    const db = admin.firestore();
    const attendanceRef = db.collection("attendance");

    try {
      const snapshot = await attendanceRef.get();
      const batch = db.batch();
      
      snapshot.forEach((doc) => {
        batch.update(doc.ref, { status: "not-checked" });
      });

      await batch.commit();
      console.log("출석 상태가 성공적으로 초기화되었습니다.");
      return null;
      
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
