const router = require('express').Router();
const ctrl = require('../controllers/priceController');
const { protect, requireModerator } = require('../middleware/auth');
const { submitLimiter } = require('../middleware/rateLimiter');

router.get('/compare/:productId', ctrl.compareByProduct);
router.post('/optimize', ctrl.optimizeBasket);
router.get('/history/:productId/:storeId', ctrl.getPriceHistory);
router.post('/', protect, submitLimiter, ctrl.submitPrice);
router.patch('/:id/approve', protect, requireModerator, ctrl.approvePrice);
router.delete('/:id', protect, requireModerator, ctrl.deletePrice);

module.exports = router;
