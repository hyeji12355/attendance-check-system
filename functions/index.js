const { defineString } = require('firebase-functions/params');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

admin.initializeApp();

exports.scheduledFunction = onSchedule({
  schedule: '0 0 * * *',
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
  memory: '256MiB'
}, async (event) => {
  try {
    const db = admin.firestore();
    const batch = db.batch();
    const snapshot = await db.collection('attendance').get();
    
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'not-checked' });
    });

    await batch.commit();
    console.log('Successfully reset attendance status');
    return null;
  } catch (error) {
    console.error('Error resetting attendance status:', error);
    throw error;
  }
});
