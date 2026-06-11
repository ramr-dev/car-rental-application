import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const IMAGE_MIME_TYPES   = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES     = 10 * 1024 * 1024; //  10 MB
const IMG_MAX_SIZE_BYTES =  8 * 1024 * 1024; //   8 MB

// ─── KYC uploader ─────────────────────────────────────────────────────────

const kycStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('uploads/kyc'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const kycUpload = multer({
  storage: kycStorage,
  fileFilter: (_req, file, cb) => {
    ALLOWED_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG, PNG and PDF files are allowed.'));
  },
  limits: { fileSize: MAX_SIZE_BYTES },
});

// ─── Vehicle image uploader ────────────────────────────────────────────────

const vehicleImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve('uploads/vehicles'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const vehicleImageUpload = multer({
  storage: vehicleImageStorage,
  fileFilter: (_req, file, cb) => {
    IMAGE_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only JPEG, PNG and WebP images are allowed.'));
  },
  limits: { fileSize: IMG_MAX_SIZE_BYTES },
});
