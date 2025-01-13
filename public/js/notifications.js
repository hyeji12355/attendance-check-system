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

// 출석 알림 발송 함수
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
