import multer from "multer";
import pkg from 'multer-storage-cloudinary';
import { v2 as cloudinary } from "cloudinary";

console.log("📦 [upload.js] Module loading...");

const { CloudinaryStorage } = pkg;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log("☁️  [upload.js] Cloudinary configured. cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === "application/pdf";
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    console.log("📎 [upload.js CloudinaryStorage] Building params for file:", {
      fieldname:    file.fieldname,
      originalname: file.originalname,
      mimetype:     file.mimetype,
      isPdf,
    });

    const params = {
      folder:        "campusly",
      resource_type: isPdf ? "raw" : "image",
      public_id:     isPdf ? `doc_${uniqueSuffix}.pdf` : `img_${uniqueSuffix}`,
      ...(!isPdf && {
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        transformation:  [{ width: 1000, height: 1000, crop: "limit" }],
      }),
    };

    console.log("📎 [upload.js CloudinaryStorage] Params built:", params);
    return params;
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    console.log("🔍 [upload.js fileFilter] Checking file:", file.originalname, "mimetype:", file.mimetype);
    const allowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("video/");

    if (allowed) {
      console.log("✅ [upload.js fileFilter] File accepted:", file.originalname);
      cb(null, true);
    } else {
      console.warn("❌ [upload.js fileFilter] File rejected:", file.originalname, "mimetype:", file.mimetype);
      cb(new Error("Only image, PDF, and video files are allowed!"), false);
    }
  },
});

console.log("✅ [upload.js] Multer instance created with CloudinaryStorage");
export default upload;