const router = require('express').Router();
const ctrl = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, ctrl.getUserAlerts);
router.post('/', protect, ctrl.createAlert);
router.delete('/:id', protect, ctrl.deleteAlert);
router.patch('/:id/toggle', protect, ctrl.toggleAlert);

module.exports = router;
