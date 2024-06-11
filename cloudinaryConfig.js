const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const path = require("path");

// Cloudinary Configuration
cloudinary.config({
  cloud_name: 'dakvtodbs',
  api_key: 564379421977521,
  api_secret: 'sGzVDdHi2xTvl0d4BQt1lA_5Prk',
});

module.exports = cloudinary;