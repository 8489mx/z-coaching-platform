import { User, ProgressPhoto } from "../models/index.js";
import {
  saveProgressPhotoToDisk,
  deleteStoredPhotoFile,
  normalizePhotoPose,
  isExternalPhotoUrl,
} from "../utils/photoStorage.js";
import { validatePhotoPayload } from "../middlewares/uploadValidator.js";

// Helper: التحقق من ملكية المشترك لبياناته أو امتلاك صلاحية المدرب/المشرف
async function isAuthorizedUserOrCoach(req, targetUserId) {
  if (!req.user || !req.user.id) return false;
  if (req.user.id === targetUserId) return true;
  const requester = await User.findByPk(req.user.id);
  return !!(requester && (requester.role === 'COACH' || requester.role === 'ADMIN'));
}

export const getUserPhotos = async (req, res) => {
  try {
    const { user_id } = req.params;

    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // التحقق من الملكية: المتدرب يعرض صوره فقط، والمدرب له حق الوصول لكافة المتدربين
    const authorized = await isAuthorizedUserOrCoach(req, user.id);
    if (!authorized) {
      return res.status(403).json({ error: "غير مصرح لك بعرض صور متدرب آخر" });
    }

    const photos = await ProgressPhoto.findAll({
      where: { user_id: user.id },
      order: [["week_number", "ASC"], ["createdAt", "ASC"]],
    });

    return res.status(200).json({ user, photos });
  } catch (err) {
    console.error("getUserPhotos error:", err);
    return res.status(500).json({ error: "فشل استرجاع صور التطور", details: err.message });
  }
};

export const uploadUserPhoto = async (req, res) => {
  try {
    const { user_id, week_number, pose, photo_url, notes } = req.body;

    let user = await User.findOne({ where: { client_code: user_id } });
    if (!user && !isNaN(user_id)) {
      user = await User.findByPk(parseInt(user_id, 10));
    }
    if (!user) {
      user = await User.findOne({ where: { phone_number: user_id } });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // التحقق من الملكية: رفع الصور لصاحب الحساب فقط أو بواسطة المدرب
    const authorized = await isAuthorizedUserOrCoach(req, user.id);
    if (!authorized) {
      return res.status(403).json({ error: "غير مصرح لك برفع صور لمتدرب آخر" });
    }

    if (!photo_url) {
      return res.status(400).json({ error: "photo_url is required" });
    }

    // Pose allowlist enforced before any file name is built.
    const normalizedPose = normalizePhotoPose(pose || "FRONT");
    if (!normalizedPose) {
      return res.status(400).json({ error: "pose غير صالح. القيم المسموح بها: FRONT أو SIDE أو BACK" });
    }

    // External links are never stored as uploads.
    if (isExternalPhotoUrl(photo_url)) {
      return res.status(400).json({ error: "الروابط الخارجية غير مقبولة كصور. ارفع الصورة مباشرة." });
    }

    // Size + magic-byte validation on the upload path (already-served
    // /uploads/ URLs skip validation; they are existing stored files).
    if (!photo_url.startsWith("/uploads/")) {
      const validation = validatePhotoPayload(photo_url);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    const clientCode = user.client_code || user.id;
    const persistentUrl = saveProgressPhotoToDisk(clientCode, photo_url, Number(week_number) || 1, normalizedPose);
    if (!persistentUrl) {
      return res.status(400).json({ error: "فشل حفظ الصورة. تأكد من صيغة الصورة وحجمها." });
    }

    const photo = await ProgressPhoto.create({
      user_id: user.id,
      week_number: Number(week_number) || 1,
      pose: normalizedPose,
      photo_url: persistentUrl,
      notes: notes || null,
    });

    return res.status(201).json({
      message: "تم رفع وحفظ صورة التطور بنجاح!",
      photo,
    });
  } catch (err) {
    console.error("uploadUserPhoto error:", err);
    return res.status(500).json({ error: "فشل رفع الصورة", details: err.message });
  }
};

export const deleteUserPhoto = async (req, res) => {
  try {
    const { photo_id } = req.params;
    const photo = await ProgressPhoto.findByPk(photo_id);

    if (!photo) {
      return res.status(404).json({ error: "الصورة غير موجودة" });
    }

    // التحقق من الملكية قبل الحذف
    const authorized = await isAuthorizedUserOrCoach(req, photo.user_id);
    if (!authorized) {
      return res.status(403).json({ error: "غير مصرح لك بحذف صور متدرب آخر" });
    }

    // Delete the file first and verify it is gone: the serve path serves
    // by folder + filename, not by database row, so destroying the row
    // alone would leave a "deleted" photo still servable. If the file
    // cannot be removed, fail loudly and keep the row.
    const deletion = deleteStoredPhotoFile(photo.photo_url);
    if (!deletion.verifiedGone) {
      return res.status(500).json({ error: "فشل حذف ملف الصورة. لم يتم حذف الصورة." });
    }

    await photo.destroy();

    return res.status(200).json({ message: "تم حذف الصورة بنجاح" });
  } catch (err) {
    console.error("deleteUserPhoto error:", err);
    return res.status(500).json({ error: "فشل حذف الصورة", details: err.message });
  }
};
