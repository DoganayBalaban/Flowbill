import crypto from "crypto";
import multer from "multer";
import multerS3 from "multer-s3";
import { env } from "../config/env";
import s3 from "../config/s3";
import { AuthRequest } from "./authMiddleware";

const receiptUpload = multer({
  storage: multerS3({
    s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    bucket: env.AWS_BUCKET_NAME,
    key: (req: AuthRequest, file, cb) => {
      const userId = req.user?.id ?? "unknown";
      const uniqueName = `receipts/${userId}/${Date.now()}-${crypto.randomUUID()}-${file.originalname}`;
      cb(null, uniqueName);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

export default receiptUpload;
