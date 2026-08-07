const { Alert } = require('../models/index');
const Price = require('../models/Price');
const User = require('../models/User');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { sendPriceAlert } = require('../services/notificationService');

const checkAlerts = async () => {
  try {
    const activeAlerts = await Alert.find({ isActive: true, notificationSent: false })
      .populate('productId')
      .lean();

    if (!activeAlerts.length) return;
    console.log(`[Alerts] Checking ${activeAlerts.length} alerts`);

    for (const alert of activeAlerts) {
      try {
        const priceQuery = {
          productId: alert.productId._id,
          inStock: true,
        };
        if (alert.storeId) priceQuery.storeId = alert.storeId;

        const cheapestPrice = await Price.findOne(priceQuery)
          .sort({ offerPrice: 1, price: 1 })
          .populate('storeId', 'name logo')
          .lean();

        if (!cheapestPrice) continue;

        const effectivePrice = cheapestPrice.offerPrice || cheapestPrice.price;

        if (effectivePrice <= alert.targetPrice) {
          // Price dropped below threshold!
          const user = await User.findById(alert.userId).select('fcmToken email name');
          if (!user) continue;

          // Send push notification
          if (user.fcmToken) {
            await sendPriceAlert(user, alert.productId, cheapestPrice.storeId, effectivePrice);
          }

          // Mark alert as triggered
          await Alert.findByIdAndUpdate(alert._id, {
            triggeredAt: new Date(),
            notificationSent: true,
            currentPrice: effectivePrice,
            isActive: false,           // Auto-deactivate after trigger
          });

          console.log(`[Alerts] Triggered: ${alert.productId.productName} @ ₹${effectivePrice} for user ${user.email}`);
        }
      } catch (err) {
        console.error(`[Alerts] Error processing alert ${alert._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Alerts] Cron job failed:', err.message);
  }
};

module.exports = { checkAlerts };
