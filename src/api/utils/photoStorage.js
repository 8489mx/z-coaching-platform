import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");
export const PROGRESS_PHOTOS_DIR = path.resolve(UPLOADS_DIR, "progress_photos");

// Ensure base upload directories exist
if (!fs.existsSync(PROGRESS_PHOTOS_DIR)) {
  fs.mkdirSync(PROGRESS_PHOTOS_DIR, { recursive: true });
}

/**
 * Saves a base64 encoded photo to disk under uploads/progress_photos/{clientCode}/
 * Returns relative serving URL: /uploads/progress_photos/{clientCode}/{filename}
 */
export function saveProgressPhotoToDisk(clientCode, base64OrUrl, weekNumber = 1, pose = 'FRONT') {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') return null;

  // If it's already a persistent serving URL, return as-is
  if (base64OrUrl.startsWith('/uploads/') || base64OrUrl.startsWith('http://') || base64OrUrl.startsWith('https://')) {
    return base64OrUrl;
  }

  // Detect image extension from Data URI mime-type
  let ext = 'webp';
  if (base64OrUrl.startsWith('data:image/jpeg') || base64OrUrl.startsWith('data:image/jpg')) {
    ext = 'jpg';
  } else if (base64OrUrl.startsWith('data:image/png')) {
    ext = 'png';
  }

  const safeClientCode = String(clientCode).replace(/[^a-zA-Z0-9_-]/g, '_');
  const userFolder = path.resolve(PROGRESS_PHOTOS_DIR, safeClientCode);
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }

  const cleanBase64 = base64OrUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const filename = `w${weekNumber}_${String(pose).toLowerCase()}_${Date.now()}.${ext}`;
  const filePath = path.resolve(userFolder, filename);

  fs.writeFileSync(filePath, buffer);

  return `/uploads/progress_photos/${safeClientCode}/${filename}`;
}
