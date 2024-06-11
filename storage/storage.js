const cloudinary = require('cloudinary').v2;
const {CloudinaryStorage} = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret:process.env.CLOUDINARY_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'unifiedPayments',
        allowedFormats: ['jpeg','png','jpg'],
        moderation: "manual",
        overwrite: false,
        public_id:(req, file) => file.originalname,
        limits: [ 5 * 1024* 1024],
        use_filename: true,
        unique_filename: false,
         
        transformation: [{
            width:250,
            height:300,
        }]
    },

});

module.exports = { cloudinary, storage };