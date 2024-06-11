const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinaryConfig");
const path = require("path");

function uploadMiddleware(folderName) {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async(req, file) => {
      const folderPath = `${folderName.trim()}`; // Update the folder path here
      const fileExtension = path.extname(file.originalname).substring(1);
      const publicId = `${file.originalname}`;
      const transformation = {
        width: 200, // Resize image to width of 200 pixels
        height: 300, // Resize image to height of 300 pixels
        crop: "fill", // Crop the image to fill the specified dimensions
        gravity: "auto", // Automatically determine the best crop position
        format: fileExtension, // Keep the original file format
        quality: "auto", // Automatically determine the best quality
      };
    
      return {
        folder: folderPath,
        public_id: publicId,
        format: fileExtension,
        transformation: transformation, // Include transformation parameters
      };
    },
  });

  return multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
      moderation: "manual"
    },
  });
}

module.exports = uploadMiddleware;