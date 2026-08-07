const router = require('express').Router();
const Store = require('../models/Store');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', async (req, res, next) => {
  try {
    const stores = await Store.find({ isActive: true }).sort({ priority: -1, name: 1 });
    res.json({ success: true, data: stores });
  } catch (err) { next(err); }
});

router.post('/', protect, requireAdmin, async (req, res, next) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (err) { next(err); }
});

router.put('/:id', protect, requireAdmin, async (req, res, next) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: store });
  } catch (err) { next(err); }
});

module.exports = router;
