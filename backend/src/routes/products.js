const router = require('express').Router();
const ctrl = require('../controllers/productController');
const { protect, requireModerator } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');

router.get('/search', searchLimiter, ctrl.search);
router.get('/trending', ctrl.getTrending);
router.get('/categories', ctrl.getCategories);
router.get('/:id', ctrl.getProduct);
router.post('/', protect, requireModerator, ctrl.createProduct);
router.put('/:id', protect, requireModerator, ctrl.updateProduct);
router.delete('/:id', protect, requireModerator, ctrl.deleteProduct);

module.exports = router;
