const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// Firebase Admin 초기화
admin.initializeApp();

// 함수 이름을 'handler'로 변경하고, exports 방식 수정
exports.handler = onSchedule("0 0 * * *", {
    timeZone: "Asia/Seoul",
    memory: "256MiB", // 메모리 설정 추가
    region: "asia-northeast3" // 서울 리전 설정
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
        throw error;
    }

    console.log("함수 실행 종료");
    return null;
});
