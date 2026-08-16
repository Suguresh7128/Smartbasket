const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// ─── Configure Cloudinary ─────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Memory storage (upload to Cloudinary directly) ────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },   // 5MB max
});

// ─── Upload to Cloudinary ─────────────────────────────────────────
// Upload to Cloudinary or fall back to local storage when Cloudinary not configured
const uploadToCloudinary = async (buffer, folder, options = {}) => {
  const cloudConfigured = !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET &&
    !String(process.env.CLOUDINARY_API_KEY).startsWith('your-') &&
    !String(process.env.CLOUDINARY_API_SECRET).startsWith('your-') &&
    !String(process.env.CLOUDINARY_CLOUD_NAME).startsWith('your-')
  );
  if (cloudConfigured) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `smartbasket/${folder}`, ...options },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });
  }

  // Local fallback: write buffer to ./uploads/<folder>/<timestamp>.<ext>
  try {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads', folder);
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const timestamp = Date.now();
    const filename = `local_${timestamp}.jpg`;
    const filePath = path.join(uploadsDir, filename);
    await fs.promises.writeFile(filePath, buffer);

    // Construct a URL that the server will serve from /uploads
    const port = process.env.PORT || 5000;
    return {
      secure_url: `http://localhost:${port}/uploads/${folder}/${filename}`,
      public_id: `local_${timestamp}`,
    };
  } catch (err) {
    throw err;
  }
};

module.exports = { upload, uploadToCloudinary, cloudinary };
