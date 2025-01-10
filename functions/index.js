const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Firebase Admin 초기화
admin.initializeApp();

exports.resetAttendanceStatus = functions.pubsub.schedule("0 0 * * *").onRun(async (context) => {
    const db = admin.firestore();
    const attendanceRef = db.collection("attendance");

    try {
        const snapshot = await attendanceRef.get();
        snapshot.forEach(async (doc) => {
            await doc.ref.update({ status: "not-checked" });
        });
        console.log("출석 상태 초기화 완료");
    } catch (error) {
        console.error("출석 상태 초기화 중 오류 발생:", error);
    }
    return null;
});
