const { onSchedule } = require("firebase-functions/v2/scheduler");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Firebase Admin 초기화
admin.initializeApp();

// Access Token 발급 함수
async function getAccessToken() {
    try {
        const base64Credentials = Buffer.from(`${process.env.PPURIO_USER_ID}:${process.env.PPURIO_API_KEY}`).toString('base64');

        const response = await fetch('https://message.ppurio.com/v1/token', {
            method: 'POST',
            headers: {
                Authorization: `Basic ${base64Credentials}`
            }
        });

        if (!response.ok) {
            throw new Error(`Access Token 발급 실패: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("발급된 Access Token:", data.token);
        return data.token;
    } catch (error) {
        console.error("Access Token 발급 중 오류 발생:", error);
        throw error;
    }
}

// 알람톡 발송 함수
async function sendAlarmTalk(phone, templateId, variables) {
    try {
        const accessToken = await getAccessToken();

        const response = await fetch('https://message.ppurio.com/v1/kakao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                senderProfile: "@뿌리오",
                templateCode: templateId,
                targets: [
                    {
                        to: phone,
                        changeWord: variables
                    }
                ]
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

// resetAttendanceStatus 함수
exports.resetAttendanceStatus = onSchedule({
    schedule: "0 15 * * *", // UTC 기준 15:00 (한국 시간 00:00)
    timeZone: "Etc/UTC",
    region: "us-central1",
    memory: "256MiB",
}, async (context) => {
    const db = admin.firestore();
    const attendanceRef = db.collection("attendance");

    try {
        const snapshot = await attendanceRef.get();
        const batch = db.batch();

        snapshot.forEach((doc) => {
            batch.update(doc.ref, { status: "not-checked" });
        });

        await batch.commit();
        console.log("모든 출석 상태 초기화 완료");
    } catch (error) {
        console.error("상태 초기화 중 오류 발생:", error);
    }
});

// sendAlarm 함수
exports.sendAlarm = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { phone, templateId, variables } = req.body;
        await sendAlarmTalk(phone, templateId, variables);
        res.status(200).send('알람톡 발송 성공');
    } catch (error) {
        console.error('알람톡 발송 오류:', error);
        res.status(500).send('알람톡 발송 실패');
    }
});
