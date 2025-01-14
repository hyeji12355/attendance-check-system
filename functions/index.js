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
                Authorization: `Basic ${base64Credentials}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Access Token 발급 실패: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("발급된 Access Token:", data.token);
        return data.token; // 발급된 토큰 반환
    } catch (error) {
        console.error("Access Token 발급 중 오류 발생:", error);
        throw error;
    }
}

// 알람톡 발송 함수
async function sendAlarmTalk(phone, templateId, variables) {
    try {
        const token = await getAccessToken();
        const response = await fetch('https://message.ppurio.com/v1/kakao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                senderProfile: '@뿌리오',
                templateCode: templateId,
                targets: [
                    {
                        to: phone,
                        changeWord: variables,
                    },
                ],
            }),
        });

        if (!response.ok) {
            throw new Error('알림톡 발송 실패');
        }

        console.log('알림톡 발송 성공');
    } catch (error) {
        console.error('알림톡 발송 중 오류:', error);
        throw error;
    }
}

// 출석 상태 초기화 함수
exports.resetAttendanceStatus = onSchedule({
    schedule: "0 15 * * *", // UTC 기준 15:00 (한국 시간 00:00)
    timeZone: "Etc/UTC",
    region: "us-central1",
    memory: "256MiB",
}, async () => {
    console.log("함수 실행 시작");
    const db = admin.firestore();
    const attendanceRef = db.collection("attendance");
    const attendanceLogsRef = db.collection("attendance_logs");

    try {
        console.log("Firestore에서 데이터 가져오기 시작");
        const snapshot = await attendanceRef.get();
        console.log(`가져온 문서 수: ${snapshot.size}`);

        // 1. 로그 생성
        const today = new Date();
        const dateString = today.toISOString().split('T')[0];

        const logsData = {
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            date: dateString,
            attendances: {}
        };

        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`로그에 추가 중: ${doc.id}`);
            logsData.attendances[doc.id] = {
                status: data.status || "not-checked", // 초기화 이전의 상태 기록
                checkInTime: data.checkInTime || null,
                checkOutTime: data.checkOutTime || null
            };
        });

        await attendanceLogsRef.doc(dateString).set(logsData);
        console.log(`${dateString} 출석 로그 생성 완료`);

        // 2. 상태 초기화
        const batch = db.batch();
        snapshot.forEach(doc => {
            console.log(`상태 초기화 중: ${doc.id}`);
            batch.update(doc.ref, { status: "not-checked" });
        });

        await batch.commit();
        console.log("Firestore 업데이트 완료");

    } catch (error) {
        console.error("처리 중 오류 발생:", error);
        throw error;
    }

    console.log("함수 실행 종료");
    return null;
});

// 알람톡 발송 트리거 함수
exports.sendAlarm = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        // Access Token 발급
        const accessToken = await getAccessToken();

        const { phone, templateId, variables } = req.body;

        // 뿌리오 API 호출
        const response = await fetch('https://message.ppurio.com/v1/kakao', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                senderProfile: "@뿌리오", // 발신 프로필명
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

        res.status(200).send('알람톡 발송 성공');
    } catch (error) {
        console.error('알람톡 발송 오류:', error);
        res.status(500).send('알람톡 발송 실패');
    }
});

// 출석 체크 트리거 함수
exports.checkInAttendance = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const { userId } = req.body;

    if (!userId) {
        res.status(400).send('userId is required');
        return;
    }

    const db = admin.firestore();
    const attendanceRef = db.collection("attendance").doc(userId);

    try {
        const doc = await attendanceRef.get();

        if (!doc.exists) {
            res.status(404).send('User not found');
            return;
        }

        // 출석 상태와 현재 시간 기록
        await attendanceRef.update({
            status: "checked", // 출석 상태를 'checked'로 변경
            checkInTime: admin.firestore.FieldValue.serverTimestamp() // 현재 시간 기록
        });

        res.status(200).send('Attendance checked in successfully');
    } catch (error) {
        console.error("Error checking in attendance:", error);
        res.status(500).send('Error checking in attendance');
    }
});

