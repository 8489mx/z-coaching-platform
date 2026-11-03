import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validatePhotoPayload } from "../middlewares/uploadValidator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.resolve(__dirname, "../../../uploads");
export const PROGRESS_PHOTOS_DIR = path.resolve(UPLOADS_DIR, "progress_photos");

// Ensure base upload directories exist
if (!fs.existsSync(PROGRESS_PHOTOS_DIR)) {
  fs.mkdirSync(PROGRESS_PHOTOS_DIR, { recursive: true });
}

/**
 * The only poses that may appear in a progress-photo file name.
 * Anything else (including path segments such as "../") is rejected
 * before any file name is built, in both upload callers.
 */
export const VALID_PHOTO_POSES = ["FRONT", "SIDE", "BACK"];

export function normalizePhotoPose(pose) {
  if (typeof pose !== "string") return null;
  const normalized = pose.trim().toUpperCase();
  return VALID_PHOTO_POSES.includes(normalized) ? normalized : null;
}

/**
 * External links are never uploads. Server-side fetching of arbitrary
 * URLs is deliberately not built here (new risk surface); callers must
 * upload the file directly.
 */
export function isExternalPhotoUrl(value) {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith("//");
}

const SERVED_PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

/**
 * Resolve a stored photo URL to its on-disk file, but only for the exact
 * shape the server serves: /uploads/progress_photos/<clientCode>/<file>.
 * Returns null for anything else (external links, data URIs, nested or
 * dotfile paths, non-image extensions), so deletion can never be tricked
 * into removing an arbitrary file.
 */
export function resolveStoredPhotoPath(photoUrl) {
  if (typeof photoUrl !== "string") return null;
  const clean = photoUrl.split("?")[0];
  const parts = clean.split("/");
  if (parts.length !== 5) return null;
  const [, uploads, dir, clientCode, filename] = parts;
  if (uploads !== "uploads" || dir !== "progress_photos") return null;
  if (!clientCode || clientCode === "." || clientCode === "..") return null;
  if (!filename || filename.startsWith(".")) return null;
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  if (!SERVED_PHOTO_EXTENSIONS.has(ext)) return null;
  const resolved = path.resolve(PROGRESS_PHOTOS_DIR, clientCode, filename);
  if (resolved !== PROGRESS_PHOTOS_DIR && !resolved.startsWith(PROGRESS_PHOTOS_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

/**
 * Delete the on-disk file for a stored photo URL and verify it is gone.
 * Non-served URLs (external links, data URIs) have no disk file, so they
 * are already "gone". Returns { hadFile, deleted, verifiedGone }.
 */
export function deleteStoredPhotoFile(photoUrl) {
  const filePath = resolveStoredPhotoPath(photoUrl);
  if (!filePath) {
    return { hadFile: false, deleted: false, verifiedGone: true };
  }
  try {
    fs.unlinkSync(filePath);
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      return { hadFile: true, deleted: false, verifiedGone: false };
    }
  }
  const verifiedGone = !fs.existsSync(filePath);
  return { hadFile: true, deleted: true, verifiedGone };
}

/**
 * Saves a base64 encoded photo to disk under uploads/progress_photos/{clientCode}/
 * Returns relative serving URL: /uploads/progress_photos/{clientCode}/{filename}
 * Returns null (never a stored value) for: external links, invalid poses,
 * non-served /uploads/ URLs, and payloads failing size/type validation.
 * The validated mime type decides the extension, never the data-URI prefix.
 */
export function saveProgressPhotoToDisk(clientCode, base64OrUrl, weekNumber = 1, pose = 'FRONT') {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') return null;

  // External links are never stored as uploads.
  if (isExternalPhotoUrl(base64OrUrl)) return null;

  // Pose allowlist enforced before any file name is built.
  const normalizedPose = normalizePhotoPose(pose);
  if (!normalizedPose) return null;

  // If it's already a persistent serving URL, accept only the exact served shape.
  if (base64OrUrl.startsWith('/uploads/')) {
    return resolveStoredPhotoPath(base64OrUrl) ? base64OrUrl : null;
  }

  // Size + magic-byte validation; the mime decides the extension.
  const validation = validatePhotoPayload(base64OrUrl);
  if (!validation.valid) return null;
  const ext = validation.mime === 'image/png' ? 'png' : validation.mime === 'image/webp' ? 'webp' : 'jpg';

  const safeClientCode = String(clientCode).replace(/[^a-zA-Z0-9_-]/g, '_');
  const userFolder = path.resolve(PROGRESS_PHOTOS_DIR, safeClientCode);
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder, { recursive: true });
  }

  const safeWeek = Number(weekNumber) || 1;
  const cleanBase64 = base64OrUrl.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  const filename = `w${safeWeek}_${normalizedPose}_${Date.now()}.${ext}`;
  const filePath = path.resolve(userFolder, filename);
  if (filePath !== userFolder && !filePath.startsWith(userFolder + path.sep)) return null;

  fs.writeFileSync(filePath, buffer);
  if (!fs.existsSync(filePath)) return null;

  return `/uploads/progress_photos/${safeClientCode}/${filename}`;
}
