const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Firebase Admin 초기화
admin.initializeApp();

exports.resetAttendanceStatus = onSchedule("0 0 * * *", {
    timeZone: "Asia/Seoul" // 한국 시간대 설정
}, async (context) => {
    const db = admin.firestore();
    const attendanceRef = db.collection("attendance");

    try {
        const snapshot = await attendanceRef.get();
        const batch = db.batch(); // 배치로 처리하여 성능 최적화

        snapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "not-checked" });
        });

        await batch.commit(); // 한 번에 실행
        console.log("출석 상태 초기화 완료");
    } catch (error) {
        console.error("출석 상태 초기화 중 오류 발생:", error);
    }
    return null;
});
