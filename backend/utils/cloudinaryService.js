const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Upload a local file to Cloudinary
 * @param {string} filePath - Absolute path to local file
 * @param {string} folder - Optional Cloudinary folder
 * @returns {Promise<string>} - The secure HTTPS URL of the uploaded image
 */
const uploadToCloudinary = async (filePath, folder = 'zest_eat_templates') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    console.warn('⚠️ Cloudinary credentials missing in .env');
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error('❌ [Cloudinary] Upload failed:', error.message);
    return null;
  }
};

/**
 * Upload from a remote URL or stream to Cloudinary
 * @param {string} remoteUrl - HTTP/HTTPS URL of image to upload
 * @param {string} folder - Optional Cloudinary folder
 * @returns {Promise<string>} - The secure HTTPS URL
 */
const uploadUrlToCloudinary = async (remoteUrl, folder = 'zest_eat_templates') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    return null;
  }

  try {
    const result = await cloudinary.uploader.upload(remoteUrl, {
      folder,
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error('❌ [Cloudinary] URL Upload failed:', error.message);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  uploadUrlToCloudinary
};
