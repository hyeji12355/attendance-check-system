const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.resetAttendanceStatus = functions
  .region('asia-northeast3')
  .pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Seoul')
  .onRun(async (context) => {
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
