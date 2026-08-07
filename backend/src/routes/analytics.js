const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/me', protect, ctrl.getUserAnalytics);
router.get('/admin/stats', protect, requireAdmin, ctrl.getAdminStats);

module.exports = router;
