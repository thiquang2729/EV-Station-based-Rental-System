const multer = require("multer");
const multerS3 = require("multer-s3");
const { s3Client, bucketName } = require("../config/aws");
const { randomUUID } = require("crypto");
const path = require("path");

// Allowed file types
const allowedMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

// File filter
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed."
      ),
      false
    );
  }
};

// Configure multer-s3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: bucketName,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
      });
    },
    key: (req, file, cb) => {
      const userId = req.user?.id || "anonymous";
      const fileExtension = path.extname(file.originalname);
      const fileName = `documents/${userId}/${randomUUID()}${fileExtension}`;
      cb(null, fileName);
    },
  }),
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = {
  uploadSingle: upload.single("document"),
  uploadMultiple: upload.array("documents", 5),
};

