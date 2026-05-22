const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload ảnh lên Cloudinary
 */
const uploadImage = async (fileBuffer, publicId) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                public_id: publicId || undefined,
                folder: 'pet-hospital',
            },
            (error, result) => {
                if (error) {
                    reject(new Error(`Upload failed: ${error.message}`));
                } else {
                    resolve(result.secure_url);
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Xóa ảnh từ Cloudinary
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result.result === 'ok';
    } catch (error) {
        throw new Error(`Delete failed: ${error.message}`);
    }
};

/**
 * Get image URL
 */
const getImageUrl = (publicId) => {
    return cloudinary.url(publicId, {
        secure: true,
        resource_type: 'auto',
    });
};

module.exports = {
    uploadImage,
    deleteImage,
    getImageUrl,
};
