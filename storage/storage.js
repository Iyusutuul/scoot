import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configuring Cloudinary
cloudinary.v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
});

// Define storage configurations
const storage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: (req, file) => {
        const originalName = path.parse(file.originalname).name;
        const uniqueId = uuidv4();
        // Extract tags from the request body
        const tagsArray = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
        return {
            folder: 'UP',
            invalidate: true,
            allowed_formats: ['jpeg', 'png', 'jpg', 'pdf'],
            moderation: "manual",
            overwrite: false,
            public_id: `${originalName}`,
            transformation: [{
                width: 200,
                height: 300,
                crop: 'fill',
                gravity: 'auto',
                quality: 'auto',
                background: 'none',
                color: 'none',
            }],
            tags: tagsArray, // Pass tags dynamically
        };
    },
});

// Define profile picture storage configuration
const profilePicStorage = new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: (req, file) => {
        const originalName = path.parse(file.originalname).name;
        const uniqueId = uuidv4();
        // Extract tags from the request body
        const tagsArray = Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags];
        return {
            folder: 'UP',
            invalidate: true,
            allowed_formats: ['jpeg', 'png', 'jpg', 'pdf'],
            moderation: "manual",
            overwrite: false,
            public_id: `${originalName}`,
            transformation: [{
                width: 200,
                height: 300,
                crop: 'fill',
                gravity: 'auto',
                quality: 'auto',
                background: 'none',
                color: 'none',
            }],
            tags: tagsArray, // Pass tags dynamically
        };
    },
});

// Export the configuration
export { cloudinary, storage, profilePicStorage };
