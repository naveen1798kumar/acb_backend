// middlewares/upload.js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

// ✅ Dynamic folder storage — detects based on route
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folderName = "acb-general";

    if (req.originalUrl.includes("/products")) folderName = "acb-products";
    else if (req.originalUrl.includes("/events")) folderName = "acb-events";
    else if (req.originalUrl.includes("/categories")) folderName = "acb-categories";

    return {
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    };
  },
});

const upload = multer({ storage });
export default upload;
