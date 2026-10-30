import fs from "node:fs";
import path from "node:path";

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

/**
 * Parse a request path below /uploads into its progress-photo parts.
 * Only the shape produced by saveProgressPhotoToDisk is servable:
 *   progress_photos/<clientCode>/<filename>
 * Returns { clientCode, filename } or null for anything else (other
 * directories, nested paths, dotfiles, non-image extensions).
 */
export function parseProgressPhotoPath(requestPath) {
  if (typeof requestPath !== "string") return null;
  const clean = requestPath.split("?")[0].replace(/^\/+/, "");
  const parts = clean.split("/");
  if (parts.length !== 3) return null;
  const [dir, clientCode, filename] = parts;
  if (dir !== "progress_photos") return null;
  if (!clientCode || clientCode === "." || clientCode === "..") return null;
  if (!filename || filename.startsWith(".")) return null;
  const dot = filename.lastIndexOf(".");
  if (dot <= 0) return null;
  const ext = filename.slice(dot + 1).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) return null;
  return { clientCode, filename };
}

/**
 * Ownership-checked file serving for /uploads (finding S4-4).
 *
 * express.static behind requireAuth alone let any authenticated account
 * fetch any client's progress photo by guessing its URL. This handler
 * resolves the folder's client code to its owner (client_code, then
 * numeric id, then phone — the same lookup the photo controller uses)
 * and serves the file only to the owner or a COACH/ADMIN. Dependency
 * injection keeps this module free of the DB layer so the access rules
 * are testable without a database; server.js wires the real lookups.
 *
 * Responses: 401 when unauthenticated, 404 for an unservable path,
 * unknown owner, or missing file (no existence leak), 403 when a known
 * owner's file is requested by another client, 500 on a lookup failure
 * (fail closed — nothing is served).
 */
export function createUploadFileHandler({ uploadsRoot, resolveOwner, isStaff }) {
  const photosRoot = path.resolve(uploadsRoot, "progress_photos");

  return async function serveUploadFile(req, res) {
    try {
      const requestPath = req.path || req.url || "";
      const parsed = parseProgressPhotoPath(requestPath);
      if (!parsed) {
        return res.status(404).json({ error: "Not found" });
      }

      const owner = await resolveOwner(parsed.clientCode);
      if (!owner) {
        return res.status(404).json({ error: "Not found" });
      }

      const requesterId = req.user?.id;
      if (!requesterId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (requesterId !== owner.id) {
        const staff = await isStaff(requesterId);
        if (!staff) {
          return res.status(403).json({ error: "غير مصرح لك بعرض صور متدرب آخر" });
        }
      }

      const filePath = path.resolve(photosRoot, parsed.clientCode, parsed.filename);
      if (filePath !== photosRoot && !filePath.startsWith(photosRoot + path.sep)) {
        return res.status(404).json({ error: "Not found" });
      }
      let stat;
      try {
        stat = fs.statSync(filePath);
      } catch {
        return res.status(404).json({ error: "Not found" });
      }
      if (!stat.isFile()) {
        return res.status(404).json({ error: "Not found" });
      }

      return res.sendFile(
        filePath,
        {
          dotfiles: "deny",
          headers: { "Cache-Control": "private, max-age=3600" },
        },
        (err) => {
          if (err && !res.headersSent) {
            res.status(404).json({ error: "Not found" });
          }
        },
      );
    } catch (err) {
      console.error("serveUploadFile error:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: "فشل استرجاع الصورة" });
      }
      return undefined;
    }
  };
}
