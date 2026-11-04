import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createUploadFileHandler } from "../src/api/utils/uploadAccess.js";
import { generateCsrfToken, verifyCsrfToken } from "../src/api/middlewares/csrfProtection.js";

// P1-B12: progress photos must never persist in a browser cache.
test("P1-B12: progress photos are served with Cache-Control no-store", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p1b12-photos-"));
  const dir = path.join(tmp, "progress_photos", "CODE1");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "pic.webp"), Buffer.from("fake-image-bytes"));

  const handler = createUploadFileHandler({
    uploadsRoot: tmp,
    resolveOwner: async () => ({ id: 7 }),
    isStaff: async () => false,
  });

  let capturedHeaders = null;
  const res = {
    status: () => res,
    json: () => res,
    sendFile: (filePath, options) => { capturedHeaders = options.headers; },
  };
  await handler({ path: "/progress_photos/CODE1/pic.webp", user: { id: 7 } }, res);
  assert.equal(capturedHeaders["Cache-Control"], "no-store");
  fs.rmSync(tmp, { recursive: true, force: true });
});

// P1-B12: a non-owner client still cannot fetch another client's photo.
test("P1-B12: non-owner client request for a photo is refused", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "p1b12-photos-"));
  const dir = path.join(tmp, "progress_photos", "CODE1");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "pic.webp"), Buffer.from("fake-image-bytes"));

  const handler = createUploadFileHandler({
    uploadsRoot: tmp,
    resolveOwner: async () => ({ id: 7 }),
    isStaff: async () => false,
  });

  let statusCode = 0;
  const res = {
    status: (c) => { statusCode = c; return res; },
    json: () => res,
    sendFile: () => { throw new Error("must not serve"); },
  };
  await handler({ path: "/progress_photos/CODE1/pic.webp", user: { id: 99 } }, res);
  assert.equal(statusCode, 403);
  fs.rmSync(tmp, { recursive: true, force: true });
});

// P1-B12: CSRF tokens verify against the resolved secret (own variable,
// never a shared fallback) and reject a wrong identifier.
test("P1-B12: CSRF token round-trips for its identifier only", () => {
  const token = generateCsrfToken("user-42");
  assert.equal(verifyCsrfToken(token, "user-42"), true);
  assert.equal(verifyCsrfToken(token, "user-43"), false);
  assert.equal(verifyCsrfToken("bogus", "user-42"), false);
});
