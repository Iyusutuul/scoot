const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');
const { v4: uuidv4 } = require('uuid');
const path = require("path");

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret:process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
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
            public_id: `${originalName}-${uniqueId}`,
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

module.exports = { cloudinary, storage };
