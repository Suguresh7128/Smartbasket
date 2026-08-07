let admin = null;

const getFirebaseAdmin = () => {
  if (admin) return admin;
  try {
    admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    return admin;
  } catch (err) {
    console.warn('[FCM] Firebase not configured:', err.message);
    return null;
  }
};

// ─── Send to single device ────────────────────────────────────────
const sendNotification = async (fcmToken, title, body, data = {}) => {
  const fb = getFirebaseAdmin();
  if (!fb || !fcmToken) return false;

  try {
    await fb.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
      android: {
        priority: 'high',
        notification: { channelId: 'price_alerts', clickAction: 'OPEN_APP' },
      },
    });
    return true;
  } catch (err) {
    console.error('[FCM] Send failed:', err.message);
    return false;
  }
};

// ─── Send price alert notification ────────────────────────────────
const sendPriceAlert = async (user, product, store, price) => {
  const title = '🏷️ Price Alert — SmartBasket';
  const body = `${product.productName} is now ₹${price} at ${store.name}!`;
  return sendNotification(user.fcmToken, title, body, {
    type: 'price_alert',
    productId: product._id.toString(),
    storeId: store._id.toString(),
    price: String(price),
  });
};

module.exports = { sendNotification, sendPriceAlert };
