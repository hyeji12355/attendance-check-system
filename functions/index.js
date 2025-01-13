const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

admin.initializeApp();

exports.resetAttendanceStatus = onSchedule({
    schedule: "0 15 * * *", // UTC 기준 15:00 (한국 시간 00:00)
    timeZone: "Etc/UTC",
    region: "us-central1", // 기존 리전 유지
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
    } catch (error) {
        console.error("출석 상태 초기화 중 오류 발생:", error);
        throw error;
    }
    
    console.log("함수 실행 종료");
    return null;
});
