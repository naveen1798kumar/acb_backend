import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary.js";

// ✅ Dynamic folder storage — detects based on request URL
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // if route contains '/events', upload to "acb-events" folder
    const folderName = req.originalUrl.includes("/events")
      ? "acb-events"
      : "acb-products";

    return {
      folder: folderName,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 800, crop: "limit" }],
    };
  },
});

const upload = multer({ storage });

export default upload;
