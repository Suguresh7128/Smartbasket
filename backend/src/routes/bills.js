const router = require('express').Router();
const ctrl = require('../controllers/billController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.get('/', protect, ctrl.getUserBills);
router.get('/:id', protect, ctrl.getBill);
router.post('/upload', protect, uploadLimiter, upload.single('bill'), ctrl.uploadBill);
router.patch('/:id', protect, ctrl.updateBillItems);

module.exports = router;
