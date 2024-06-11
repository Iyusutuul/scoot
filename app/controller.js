const cloudinary = require

    cloudinary.v2.uploader.upload(req.files.image.path,{
        tags: req.body.tags})
