const router = require('express').Router();
const ctrl   = require('../controllers/locationController');
const { protect }   = require('../middleware/auth');
const { apiLimiter} = require('../middleware/rateLimiter');

// Public
router.get('/pincode/:pincode',    apiLimiter, ctrl.lookupPincode);
router.get('/stores/:pincode',     apiLimiter, ctrl.getStoresForPincode);
router.get('/autocomplete',                    ctrl.autocompletePincode);
router.get('/coverage/bangalore',              ctrl.bangaloreCoverage);

// Auth required
router.post('/save', protect, ctrl.saveUserLocation);

module.exports = router;
