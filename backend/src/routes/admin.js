const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

// Store & seed management
router.post('/seed-stores',          ctrl.seedStores);

// User management
router.get('/users',                 ctrl.getUsers);
router.patch('/users/:id/toggle',    ctrl.toggleUserStatus);
router.patch('/users/:id/role',      ctrl.updateUserRole);

// Price moderation
router.get('/prices/pending',        ctrl.getPendingPrices);

// Outlet management
router.get('/outlets',               ctrl.getOutlets);
router.post('/outlets',              ctrl.createOutlet);
router.patch('/outlets/:id/toggle',  ctrl.toggleOutlet);

module.exports = router;
