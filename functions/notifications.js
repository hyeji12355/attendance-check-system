import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// 알람톡 발송 함수
async function sendAlarmTalk(phone, templateId, variables) {
    try {
        const response = await fetch('/api/send-alarm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone,
                templateId,
                variables
            })
        });
        
        if (!response.ok) {
            throw new Error('알람톡 발송 실패');
        }
        
        console.log('알람톡 발송 성공');
    } catch (error) {
        console.error('알람톡 발송 중 오류:', error);
        throw error;
    }
}

// 미출석 알림 발송 함수
export async function sendAttendanceNotification(userId) {
    try {
        // 사용자 정보 가져오기
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) {
            throw new Error('사용자 정보를 찾을 수 없음');
        }

        const userData = userDoc.data();
        const variables = {
            name: userData.name
        };

        // 출석자에게 알람톡 발송
        await sendAlarmTalk(
            userData.contact,
            'ppur_2025010219515692092846588',
            variables
        );

        // 보호자 알림이 활성화된 경우 보호자에게도 발송
        if (userData.preferences?.notify_guardian) {
            await sendAlarmTalk(
                userData.guardian_contact,
                'ppur_2025010219515692092846588',
                variables
            );
        }

        console.log('알람톡 발송 완료');
    } catch (error) {
        console.error('알림 발송 중 오류:', error);
        throw error;
    }
}
// 시간 기반 출석 알림 발송 함수
export async function sendTimeBasedNotifications(currentTime) {
    try {
        // Firestore에서 `check_time`이 현재 시간과 일치하는 사용자 검색
        const usersRef = db.collection("users");
        const snapshot = await usersRef.where("check_time", "==", currentTime).get();

        if (snapshot.empty) {
            console.log(`${currentTime}에 알림을 받을 사용자가 없습니다.`);
            return;
        }

        // 각 사용자에 대해 알림 발송
        for (const doc of snapshot.docs) {
            const userData = doc.data();

            // 알림톡 발송
            const variables = {
                name: userData.name,
                userId: userData.user_id,
            };
            await sendAlarmTalk(
                userData.contact,
                'ppur_2025010219515692092846588',
                variables
            );

            // 보호자에게도 알림톡 발송 (notify_guardian 설정 확인)
            if (userData.preferences?.notify_guardian) {
                await sendAlarmTalk(
                    userData.guardian_contact,
                    'ppur_2025010219515692092846588',
                    variables
                );
            }
        }

        console.log(`${currentTime}에 맞는 사용자들에게 알림톡 발송 완료`);
    } catch (error) {
        console.error(`${currentTime} 알림톡 발송 중 오류:`, error);
        throw error;
    }
}
