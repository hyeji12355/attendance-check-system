const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Firebase Admin 초기화
admin.initializeApp();

exports.resetAttendanceStatus = onSchedule("0 0 * * *", async (context) => {
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