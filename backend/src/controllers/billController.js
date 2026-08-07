const { Bill } = require('../models/index');
const { uploadToCloudinary } = require('../middleware/upload');
const { extractBillItems } = require('../services/ocrService');
const { findBestMatch } = require('../services/matchingEngine');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Price = require('../models/Price');

// ─── Upload and process bill ───────────────────────────────────────
exports.uploadBill = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    // 1. Upload to Cloudinary
    const uploaded = await uploadToCloudinary(req.file.buffer, 'bills', {
      quality: 'auto:low',        // Compress for lightweight storage
      width: 1200,
      crop: 'limit',
    });

    // 2. Create bill record (processing state)
    const bill = await Bill.create({
      userId: req.user._id,
      imageUrl: uploaded.secure_url,
      imagePublicId: uploaded.public_id,
      status: 'processing',
    });

    // 3. Run OCR (async — don't block response)
    processBillAsync(bill._id, uploaded.secure_url, req.user._id);

    res.status(202).json({
      success: true,
      message: 'Bill uploaded. Processing started.',
      data: { billId: bill._id, status: 'processing' },
    });
  } catch (err) {
    next(err);
  }
};

// ─── Poll bill status ──────────────────────────────────────────────
exports.getBill = async (req, res, next) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('storeId', 'name logo')
      .lean();
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

// ─── Get user bills history ────────────────────────────────────────
exports.getUserBills = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [bills, total] = await Promise.all([
      Bill.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('storeId', 'name logo')
        .lean(),
      Bill.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ success: true, data: bills, total, page: parseInt(page) });
  } catch (err) {
    next(err);
  }
};

// ─── Correct bill items (user edits OCR result) ────────────────────
exports.updateBillItems = async (req, res, next) => {
  try {
    const { items, storeId, storeName } = req.body;

    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    bill.items = items;
    bill.storeId = storeId;
    bill.storeName = storeName;
    bill.totalAmount = items.reduce((sum, i) => sum + (i.price || 0), 0);
    await bill.save();

    // Save prices in background
    if (storeId) savePricesFromBill(items, storeId, req.user._id);

    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

// ─── Background: async OCR processing ─────────────────────────────
async function processBillAsync(billId, imageUrl, userId) {
  try {
    const { items, storeName } = await extractBillItems(imageUrl);

    // Try to match store
    let storeId = null;
    if (storeName) {
      const store = await Store.findOne({
        name: { $regex: new RegExp(storeName, 'i') },
        isActive: true,
      });
      storeId = store?._id;
    }

    // Match products in catalog
    const matchedItems = await Promise.all(
      items.map(async (item) => {
        const match = await findBestMatch(item.name);
        return { ...item, productId: match?._id || null, matched: !!match };
      })
    );

    const totalAmount = matchedItems.reduce((sum, i) => sum + (i.price || 0), 0);

    await Bill.findByIdAndUpdate(billId, {
      items: matchedItems,
      storeId,
      storeName,
      totalAmount,
      status: 'done',
    });

    // Save prices to DB in background
    if (storeId) savePricesFromBill(matchedItems, storeId, userId);

  } catch (err) {
    console.error('[OCR] Processing failed:', err.message);
    await Bill.findByIdAndUpdate(billId, { status: 'failed' });
  }
}

// ─── Save extracted prices to Price collection ────────────────────
async function savePricesFromBill(items, storeId, userId) {
  for (const item of items) {
    if (!item.productId || !item.price) continue;
    try {
      await Price.findOneAndUpdate(
        { productId: item.productId, storeId },
        {
          price: item.price,
          source: 'bill_upload',
          submittedBy: userId,
          lastUpdated: new Date(),
          isVerified: true,  // Bill uploads are trusted
        },
        { upsert: true }
      );
    } catch {}
  }
}
