import multer, { FileFilterCallback } from "multer";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const getUploadPath = (mimetype: string) => {
  if (mimetype === "application/pdf") return path.join("uploads", "pdf");
  if (["image/jpeg", "image/jpg", "image/png"].includes(mimetype))
    return path.join("uploads", "images");
  return path.join("uploads", "others");
};

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getUploadPath(file.mimetype);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const uuid = crypto.randomUUID();
    const modifiedName = `${nameWithoutExt}-${uuid}${ext}`;
    cb(null, modifiedName);
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, JPG, JPEG, and PNG files are allowed"));
  }
};

export const upload = multer({
  storage: storageConfig,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
