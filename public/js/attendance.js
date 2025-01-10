import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    Timestamp,
    getDoc,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// URL에서 user_id 가져오기
const params = new URLSearchParams(window.location.search);
const userId = params.get("user_id");

// 출석 확인 및 업데이트
if (userId) {
    const attendanceDoc = doc(db, "attendance", userId);

    // Firestore 문서가 존재하는지 확인하고 업데이트
    getDoc(attendanceDoc)
        .then((docSnap) => {
            if (docSnap.exists()) {
                // 출석 상태 업데이트
                updateDoc(attendanceDoc, {
                    status: "checked",
                    date: Timestamp.now(),
                })
                    .then(() => {
                        document.querySelector("h1").textContent = "출석 완료!";
                        document.querySelector("p").textContent =
                            "오늘도 좋은 하루 보내세요!";
                        console.log("출석 상태가 업데이트되었습니다.");
                    })
                    .catch((error) => {
                        document.querySelector("h1").textContent = "오류 발생";
                        document.querySelector("p").textContent =
                            "출석 처리 중 문제가 발생했습니다.";
                        console.error("출석 업데이트 실패:", error);
                    });
            } else {
                document.querySelector("h1").textContent = "사용자 정보 없음";
                document.querySelector("p").textContent =
                    "해당 user_id로 등록된 정보가 없습니다.";
            }
        })
        .catch((error) => {
            document.querySelector("h1").textContent = "오류 발생";
            document.querySelector("p").textContent = "데이터를 불러오지 못했습니다.";
            console.error("Firestore 문서 조회 실패:", error);
        });
} else {
    document.querySelector("h1").textContent = "잘못된 요청";
    document.querySelector("p").textContent =
        "URL에 user_id가 포함되어 있지 않습니다.";
}

// 모든 사용자의 status를 not-checked로 업데이트
export const resetAllStatuses = async () => {
    try {
        const attendanceCollection = collection(db, "attendance");
        const snapshot = await getDocs(attendanceCollection);

        // 각 문서의 status 업데이트
        snapshot.forEach(async (docSnap) => {
            await updateDoc(docSnap.ref, { status: "not-checked" });
        });

        console.log("모든 사용자의 출석 상태가 not-checked로 초기화되었습니다.");
    } catch (error) {
        console.error("상태 초기화 중 오류 발생:", error);
    }
};

// 테스트 실행용 코드 (원하는 조건에서 호출하세요)
// resetAllStatuses();
