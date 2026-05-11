import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

const storage = multer.memoryStorage();
export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

function isCloudinaryConfigured() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return Boolean(cloud && key && secret);
}

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${b64}`;

    /* Avoid calling Cloudinary without keys — it throws "Must supply api_key". */
    if (!isCloudinaryConfigured()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[upload] CLOUDINARY_* not set — returning data URL. Add Cloudinary keys to config/appEnv.local.ts for hosted URLs.',
        );
      }
      return res.json({
        url: dataUri,
        publicId: null,
      });
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: process.env.CLOUDINARY_FOLDER || 'ecommerce',
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (e) {
    next(e);
  }
};
